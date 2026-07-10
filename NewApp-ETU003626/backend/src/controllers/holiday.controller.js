import { holidayDao } from '../dao/holiday.dao.js';

/** CRUD des jours fériés (SQLite). [J2 - 1.b] */

// Valide le corps de requête ; répond 400 et renvoie null si invalide.
function validateBody(req, res) {
  const { date, label } = req.body;
  if (!date || !label) {
    res.status(400).json({ error: 'Champs date et label requis.' });
    return null;
  }
  return { date, label };
}

// Vrai si un AUTRE jour férié occupe déjà cette date (unicité).
function dateTakenByOther(date, excludeId = null) {
  const existing = holidayDao.getByDate(date);
  return existing && String(existing.id) !== String(excludeId);
}

export async function listHolidays(req, res, next) {
  try {
    res.json(holidayDao.getAll());
  } catch (err) {
    next(err);
  }
}

export async function createHoliday(req, res, next) {
  try {
    const body = validateBody(req, res);
    if (!body) return;
    if (dateTakenByOther(body.date)) {
      return res.status(400).json({ error: 'Un jour férié existe déjà à cette date.' });
    }
    const id = holidayDao.insert(body);
    res.status(201).json({ id, ...body });
  } catch (err) {
    next(err);
  }
}

export async function updateHoliday(req, res, next) {
  try {
    const { id } = req.params;
    const body = validateBody(req, res);
    if (!body) return;
    if (dateTakenByOther(body.date, id)) {
      return res.status(400).json({ error: 'Un autre jour férié existe déjà à cette date.' });
    }
    holidayDao.update(Number(id), body);
    res.json({ id: Number(id), ...body });
  } catch (err) {
    next(err);
  }
}

export async function deleteHoliday(req, res, next) {
  try {
    holidayDao.delete(Number(req.params.id));
    res.json({ success: true, message: 'Jour férié supprimé.' });
  } catch (err) {
    next(err);
  }
}
