import { getDb } from '../db/sqlite.js';

export const holidayDao = {
  getAll() {
    const db = getDb();
    return db.prepare('SELECT * FROM holidays ORDER BY date ASC').all();
  },

  getById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM holidays WHERE id = ?').get(id);
  },

  getByDate(date) {
    const db = getDb();
    return db.prepare('SELECT * FROM holidays WHERE date = ?').get(date);
  },

  insert({ date, label }) {
    const db = getDb();
    const result = db.prepare('INSERT INTO holidays (date, label) VALUES (?, ?)').run(date, label);
    return result.lastInsertRowid;
  },

  update(id, { date, label }) {
    const db = getDb();
    db.prepare('UPDATE holidays SET date = ?, label = ? WHERE id = ?').run(date, label, id);
  },

  delete(id) {
    const db = getDb();
    db.prepare('DELETE FROM holidays WHERE id = ?').run(id);
  },
};
