import { getDb } from '../db/sqlite.js';

/**
 * Accès aux données employés en base SQLite locale.
 * Placeholder : la table et les requêtes seront définies au J2.
 */
export const employeeDao = {
  // eslint-disable-next-line no-unused-vars
  insert(employee) {
    // TODO (J2) : getDb().prepare('INSERT INTO employees ...').run(...)
    throw new Error('employeeDao.insert: pas encore implémenté (J2).');
  },
  deleteAll() {
    // TODO (J2)
    throw new Error('employeeDao.deleteAll: pas encore implémenté (J2).');
  },
};
