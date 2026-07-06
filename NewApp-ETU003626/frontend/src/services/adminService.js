import { backend } from '../api/backend';

/** Appels au backend NewApp (protégés par le code backoffice). */

// [J1 - 1.b] Réinitialiser les données.
export function resetData() {
  return backend.post('/api/reset').then((r) => r.data);
}

// [J1 - 1.c] Importer les 2 CSV + le ZIP de photos.
// `files` : { employes: File, salaires: File, images: File }
export function importData(files) {
  const form = new FormData();
  if (files.employes) form.append('employes', files.employes);
  if (files.salaires) form.append('salaires', files.salaires);
  if (files.images) form.append('images', files.images);
  return backend
    .post('/api/import', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
}
