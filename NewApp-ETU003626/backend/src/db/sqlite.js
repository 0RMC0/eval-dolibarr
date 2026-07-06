import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config/index.js';

/**
 * Connexion SQLite partagée.
 * Non utilisée par les fonctionnalités J1 — mise en place pour le J2.
 */
let db = null;

export function getDb() {
  if (db) return db;

  const dir = dirname(config.sqlitePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  db = new Database(config.sqlitePath);
  db.pragma('journal_mode = WAL');

  // Initialisation du schéma J2
  db.prepare(`
    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL
    )
  `).run();

  return db;
}
