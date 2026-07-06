import { getPool, prefix } from '../db/mysql.js';
import { getDb } from '../db/sqlite.js';

/**
 * Supprime directement dans MySQL les données issues de l'import [J1 - 1.b] :
 *  - tous les paiements de salaire        ({p}payment_salary)
 *  - tous les salaires                     ({p}salary)
 *  - les employés importés                 ({p}user où ref_employee est renseigné, sauf admin)
 *    + leurs lignes dépendantes (droits, params, groupes)
 *
 * Renvoie le nombre de lignes supprimées par catégorie.
 */
export async function resetDolibarr() {
  const pool = getPool();
  const conn = await pool.getConnection();
  const counts = { paiements: 0, salaires: 0, employes: 0 };
  try {
    // Employés importés (jamais l'admin rowid=1) — on récupère aussi `photo`
    // pour que le service puisse supprimer les fichiers via l'API Dolibarr.
    const [rows] = await conn.query(
      `SELECT rowid, photo FROM ${prefix}user
       WHERE ref_employee IS NOT NULL AND ref_employee <> '' AND rowid <> 1`
    );
    const users = rows.map((r) => ({ id: r.rowid, photo: r.photo }));
    const userIds = users.map((u) => u.id);

    await conn.beginTransaction();

    const [pay] = await conn.query(`DELETE FROM ${prefix}payment_salary`);
    counts.paiements = pay.affectedRows;

    const [sal] = await conn.query(`DELETE FROM ${prefix}salary`);
    counts.salaires = sal.affectedRows;

    if (userIds.length > 0) {
      await conn.query(`DELETE FROM ${prefix}user_rights WHERE fk_user IN (?)`, [userIds]);
      await conn.query(`DELETE FROM ${prefix}user_param WHERE fk_user IN (?)`, [userIds]);
      await conn.query(`DELETE FROM ${prefix}usergroup_user WHERE fk_user IN (?)`, [userIds]);
      const [usr] = await conn.query(`DELETE FROM ${prefix}user WHERE rowid IN (?)`, [userIds]);
      counts.employes = usr.affectedRows;
    }

    await conn.commit();
    // La liste `users` sert au service pour supprimer les fichiers photo via l'API.
    return { counts, users };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Vide toutes les tables applicatives de la base SQLite locale [J1 - 1.b].
 * Sans schéma (J2 à venir), l'opération ne supprime rien mais reste sûre.
 * Renvoie le nombre de tables vidées.
 */
export function resetSqlite() {
  const db = getDb();
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all();
  const tx = db.transaction(() => {
    for (const { name } of tables) {
      db.prepare(`DELETE FROM "${name}"`).run();
    }
  });
  tx();
  return { tablesVidees: tables.length };
}
