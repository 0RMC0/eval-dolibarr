import { readFileSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { parseCsv, parseAmount } from '../utils/csv.js';
import { parsePayments } from '../utils/payment-parser.js';
import { frToIso } from '../utils/date.js';
import { extractZip } from '../utils/zip.js';
import {
  dolibarr,
  createUser,
  createSalary,
  addSalaryPayment,
  setUserPhoto,
} from './dolibarr.service.js';

/**
 * Import des 2 CSV + ZIP de photos vers Dolibarr. [J1 - 1.c]
 *
 * Étapes isolées et résilientes (une erreur sur une ligne n'annule pas le reste) :
 *  1. employés  -> POST /users            (map ref_employe -> userId)
 *  2. salaires  -> POST /salaries         (map ref_salaire -> salaryId)
 *  3. paiements -> POST /salaries/{id}/payments (paiement en plusieurs fois)
 *  4. photos    -> chaque image = photo de l'employé (par ref_employe)
 */
export async function importData({ employesCsvPath, salairesCsvPath, imagesZipPath }) {
  const report = {
    employes: { crees: 0, erreurs: [] },
    salaires: { crees: 0, erreurs: [] },
    paiements: { crees: 0, erreurs: [] },
    photos: { associees: 0, erreurs: [] },
  };
  const userIdByRef = new Map(); // ref_employe -> id user Dolibarr

  try {
    // Récupérer les utilisateurs existants dans Dolibarr pour pouvoir matcher les imports un par un
    try {
      const existingUsers = await dolibarr.get('/users?limit=1000') || [];
      for (const u of existingUsers) {
        if (u.ref_employee) {
          userIdByRef.set(String(u.ref_employee), u.id);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs existants:', err);
    }

    // 1. Employés
    if (employesCsvPath) {
      const employees = mapEmployees(readFileSync(employesCsvPath, 'utf8'));
      for (const emp of employees) {
        try {
          let userId = userIdByRef.get(String(emp.ref));
          if (!userId) {
            userId = await createUser(emp);
            userIdByRef.set(String(emp.ref), userId);
            report.employes.crees++;
          }
        } catch (err) {
          report.employes.erreurs.push({ ref: emp.ref, message: err.message });
        }
      }
    }

    // 2. Salaires + 3. Paiements
    if (salairesCsvPath) {
      const salaries = mapSalaries(readFileSync(salairesCsvPath, 'utf8'));
      for (const sal of salaries) {
        const userId = userIdByRef.get(String(sal.refEmploye));
        if (!userId) {
          report.salaires.erreurs.push({
            ref: sal.ref,
            message: `Employé réf. ${sal.refEmploye} introuvable (non importé).`,
          });
          continue;
        }
        let salaryId;
        try {
          salaryId = await createSalary(sal, userId);
          report.salaires.crees++;
        } catch (err) {
          report.salaires.erreurs.push({ ref: sal.ref, message: err.message });
          continue;
        }
        // Paiements (échelonnés)
        for (const p of sal.paiements) {
          try {
            await addSalaryPayment(salaryId, { dateIso: frToIso(p.date), montant: p.montant });
            report.paiements.crees++;
          } catch (err) {
            report.paiements.erreurs.push({ refSalaire: sal.ref, message: err.message });
          }
        }
      }
    }

    // 4. Photos (nom de fichier = ref_employe, ex. "1.png")
    if (imagesZipPath) {
      const files = await extractZip(imagesZipPath);
      for (const [name, buffer] of files) {
        const ref = name.replace(/\.[^.]+$/, ''); // "1.png" -> "1"
        const userId = userIdByRef.get(ref);
        if (!userId) {
          report.photos.erreurs.push({ fichier: name, message: `Aucun employé réf. ${ref}.` });
          continue;
        }
        try {
          await setUserPhoto(userId, name, buffer);
          report.photos.associees++;
        } catch (err) {
          report.photos.erreurs.push({ fichier: name, message: err.message });
        }
      }
    }
  } finally {
    // Nettoyage des fichiers temporaires uploadés
    await Promise.all(
      [employesCsvPath, salairesCsvPath, imagesZipPath]
        .filter(Boolean)
        .map((p) => unlink(p).catch(() => {}))
    );
  }

  return report;
}

/** Transforme les lignes du CSV employés en objets normalisés. */
export function mapEmployees(csvContent) {
  return parseCsv(csvContent).map((row) => ({
    ref: row.ref_employe,
    nom: row.nom,
    genre: row.genre,
    identifiant: row.identifiant,
    motDePasse: row.mdp,
    heuresParSemaine: Number(row.heure_travail_semaine),
    poste: row.poste,
  }));
}

/** Transforme les lignes du CSV salaires (montant FR + paiements) en objets normalisés. */
export function mapSalaries(csvContent) {
  return parseCsv(csvContent).map((row) => ({
    ref: row.ref_salaire,
    refEmploye: row.ref_employe,
    dateDebut: row.date_debut,
    dateFin: row.date_fin,
    dateDebutIso: frToIso(row.date_debut),
    dateFinIso: frToIso(row.date_fin),
    montant: parseAmount(row.montant),
    paiements: parsePayments(row.paiement),
  }));
}
