import { config } from '../config/index.js';

/**
 * Client bas niveau vers l'API REST Dolibarr, côté backend.
 * (Le frontend, lui, appelle Dolibarr en direct.)
 */
async function dolibarrFetch(path, options = {}) {
  const url = `${config.dolibarr.url}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      DOLAPIKEY: config.dolibarr.apiKey,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dolibarr ${options.method || 'GET'} ${path} -> ${res.status}: ${body}`);
  }
  return res.status === 204 ? null : res.json();
}

export const dolibarr = {
  get: (path) => dolibarrFetch(path),
  post: (path, body) => dolibarrFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => dolibarrFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => dolibarrFetch(path, { method: 'DELETE' }),
};

// --- Fonctions métier utilisées par l'import [J1 - 1.c] ---

const GENDER_MAP = { homme: 'man', femme: 'woman' };

/**
 * Crée un utilisateur Dolibarr (employé/salarié). Renvoie l'id créé.
 */
export function createUser(employee) {
  return dolibarr.post('/users', {
    login: employee.identifiant,
    pass: employee.motDePasse,
    lastname: employee.nom,
    gender: GENDER_MAP[String(employee.genre).toLowerCase()] || '',
    job: employee.poste,
    weeklyhours: employee.heuresParSemaine,
    ref_employee: employee.ref,
    employee: 1,
  });
}

/**
 * Crée un salaire pour un employé. Renvoie l'id du salaire.
 */
export function createSalary(salary, userId) {
  return dolibarr.post('/salaries', {
    fk_user: userId,
    label: `Salaire réf. ${salary.ref} — ${salary.dateDebut} au ${salary.dateFin}`,
    amount: salary.montant,
    datesp: salary.dateDebutIso,
    dateep: salary.dateFinIso,
  });
}

/**
 * Ajoute un paiement (partiel) à un salaire. `payment` = { dateIso, montant }.
 */
export function addSalaryPayment(salaryId, payment) {
  const typeId = config.dolibarr.paymentTypeId;
  return dolibarr.post(`/salaries/${salaryId}/payments`, {
    paiementtype: typeId, // requis par la validation de l'API
    fk_typepayment: typeId, // réellement utilisé à la création
    chid: salaryId, // requis par la validation
    datepaye: payment.dateIso,
    amounts: { [salaryId]: payment.montant }, // clé = id du salaire
    // Pas d'accountid : le module Banque n'est pas actif.
  });
}

/** Dépose un fichier dans le dossier documents d'un utilisateur Dolibarr. */
function uploadUserFile(subdir, filename, base64) {
  return dolibarr.post('/documents/upload', {
    filename,
    modulepart: 'user',
    subdir,
    filecontent: base64,
    fileencoding: 'base64',
    overwriteifexists: 1,
  });
}

/**
 * Envoie la photo d'un employé dans son dossier Dolibarr et la définit comme
 * photo de l'utilisateur.
 *
 * La fiche utilisateur affiche la VIGNETTE (photos/thumbs/{base}_small.ext) :
 * l'API ne génère pas les thumbs pour un user, on les dépose donc nous-mêmes
 * (mêmes octets — les images sont de petites icônes, redimensionnées à l'affichage).
 */
export async function setUserPhoto(userId, filename, buffer) {
  const ext = (filename.match(/\.[^.]+$/) || ['.png'])[0];
  const base = filename.slice(0, filename.length - ext.length);
  const b64 = buffer.toString('base64');

  await uploadUserFile(`${userId}/photos`, filename, b64);
  await uploadUserFile(`${userId}/photos/thumbs`, `${base}_small${ext}`, b64);
  await uploadUserFile(`${userId}/photos/thumbs`, `${base}_mini${ext}`, b64);

  await dolibarr.put(`/users/${userId}`, { photo: filename });
}

/**
 * Supprime la photo d'un employé et ses vignettes via l'API documents. [J1 - 1.b]
 * Passe par l'API (HTTP) et non le système de fichiers : fonctionne même si
 * Dolibarr est hébergé sur un autre serveur. Renvoie le nombre de fichiers supprimés.
 */
export async function deleteUserPhotoFiles(userId, photo) {
  if (!photo) return 0;
  const ext = (photo.match(/\.[^.]+$/) || ['.png'])[0];
  const base = photo.slice(0, photo.length - ext.length);
  const files = [
    `${userId}/photos/${photo}`,
    `${userId}/photos/thumbs/${base}_small${ext}`,
    `${userId}/photos/thumbs/${base}_mini${ext}`,
  ];

  let supprimes = 0;
  for (const f of files) {
    try {
      await dolibarr.delete(
        `/documents?modulepart=user&original_file=${encodeURIComponent(f)}`
      );
      supprimes++;
    } catch {
      // Fichier déjà absent : on ignore.
    }
  }
  return supprimes;
}
