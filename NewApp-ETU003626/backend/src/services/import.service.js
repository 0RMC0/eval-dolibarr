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
 * Chaque fichier est optionnel (import un par un possible) et chaque étape est
 * résiliente : une erreur sur une ligne n'annule pas le reste, tout est
 * consigné dans le rapport renvoyé au frontend.
 */
export async function importData({ employesCsvPath, salairesCsvPath, imagesZipPath }) {
  const report = {
    employes: { crees: 0, erreurs: [] },
    salaires: { crees: 0, erreurs: [] },
    paiements: { crees: 0, erreurs: [] },
    photos: { associees: 0, erreurs: [] },
  };

  // ref_employe -> id user Dolibarr. Pré-rempli avec les employés déjà
  // présents pour pouvoir importer salaires/photos séparément des employés.
  const userIdByRef = await loadExistingUserRefs();

  try {
    if (employesCsvPath) {
      await importEmployees(employesCsvPath, userIdByRef, report.employes);
    }
    if (salairesCsvPath) {
      await importSalaries(salairesCsvPath, userIdByRef, report);
    }
    if (imagesZipPath) {
      await importPhotos(imagesZipPath, userIdByRef, report.photos);
    }
  } finally {
    await removeTempFiles([employesCsvPath, salairesCsvPath, imagesZipPath]);
  }

  return report;
}

/** Map ref_employee -> id des utilisateurs déjà présents dans Dolibarr. */
async function loadExistingUserRefs() {
  const map = new Map();
  try {
    const users = (await dolibarr.get('/users?limit=1000')) || [];
    for (const u of users) {
      if (u.ref_employee) map.set(String(u.ref_employee), u.id);
    }
  } catch (err) {
    console.error('Erreur lors du chargement des utilisateurs existants:', err);
  }
  return map;
}

/** Étape 1 : crée les employés du CSV (ignore ceux déjà présents). */
async function importEmployees(csvPath, userIdByRef, result) {
  for (const emp of mapEmployees(readFileSync(csvPath, 'utf8'))) {
    if (userIdByRef.has(String(emp.ref))) continue; // déjà importé
    try {
      const userId = await createUser(emp);
      userIdByRef.set(String(emp.ref), userId);
      result.crees++;
    } catch (err) {
      result.erreurs.push({ ref: emp.ref, message: err.message });
    }
  }
}

/** Étapes 2 + 3 : crée les salaires puis leurs paiements échelonnés. */
async function importSalaries(csvPath, userIdByRef, report) {
  for (const sal of mapSalaries(readFileSync(csvPath, 'utf8'))) {
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

    await importPayments(sal, salaryId, report.paiements);
  }
}

/** Étape 3 : enregistre les paiements (partiels) d'un salaire. */
async function importPayments(sal, salaryId, result) {
  for (const p of sal.paiements) {
    try {
      await addSalaryPayment(salaryId, { dateIso: frToIso(p.date), montant: p.montant });
      result.crees++;
    } catch (err) {
      result.erreurs.push({ refSalaire: sal.ref, message: err.message });
    }
  }
}

/** Étape 4 : associe chaque image du ZIP à son employé (nom = ref_employe). */
async function importPhotos(zipPath, userIdByRef, result) {
  const files = await extractZip(zipPath);
  for (const [name, buffer] of files) {
    const ref = name.replace(/\.[^.]+$/, ''); // "1.png" -> "1"
    const userId = userIdByRef.get(ref);
    if (!userId) {
      result.erreurs.push({ fichier: name, message: `Aucun employé réf. ${ref}.` });
      continue;
    }
    try {
      await setUserPhoto(userId, name, buffer);
      result.associees++;
    } catch (err) {
      result.erreurs.push({ fichier: name, message: err.message });
    }
  }
}

/** Supprime les fichiers temporaires uploadés (tolérant si déjà absents). */
function removeTempFiles(paths) {
  return Promise.all(paths.filter(Boolean).map((p) => unlink(p).catch(() => {})));
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
