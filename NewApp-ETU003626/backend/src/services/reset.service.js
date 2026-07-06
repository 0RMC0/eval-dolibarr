import { resetDolibarr, resetSqlite } from '../dao/reset.dao.js';
import { deleteUserPhotoFiles } from './dolibarr.service.js';

/**
 * Réinitialise les données [J1 - 1.b] :
 *  - MySQL Dolibarr : paiements, salaires, employés importés (via DAO)
 *  - Fichiers photo : supprimés via l'API Dolibarr (compatible serveur distant)
 *  - SQLite local   : toutes les tables applicatives
 */
export async function resetData() {
  const { counts, users } = await resetDolibarr();

  // Suppression des fichiers photo des employés supprimés, via l'API HTTP
  // (fonctionne même si Dolibarr est hébergé sur un autre serveur).
  let fichiers = 0;
  for (const user of users) {
    fichiers += await deleteUserPhotoFiles(user.id, user.photo);
  }

  const sqlite = resetSqlite();
  return { dolibarr: { ...counts, fichiers }, sqlite };
}
