import mysql from 'mysql2/promise';
import { config } from '../config/index.js';

/**
 * Pool MySQL partagé vers la base Dolibarr.
 * Utilisé par la réinitialisation directe des données [J1 - 1.b].
 */
let pool = null;

export function getPool() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    waitForConnections: true,
    connectionLimit: 5,
  });
  return pool;
}

/** Préfixe des tables Dolibarr (ex. "llx_"). */
export const prefix = config.mysql.prefix;
