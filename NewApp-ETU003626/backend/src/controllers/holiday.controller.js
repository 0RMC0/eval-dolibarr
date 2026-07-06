import { holidayDao } from '../dao/holiday.dao.js';

export async function listHolidays(req, res, next) {
  try {
    const list = holidayDao.getAll();
    res.json(list);
  } catch (err) {
    next(err);
  }
}

export async function createHoliday(req, res, next) {
  try {
    const { date, label } = req.body;
    if (!date || !label) {
      return res.status(400).json({ error: 'Champs date et label requis.' });
    }
    // Vérification unicité de la date
    const existing = holidayDao.getByDate(date);
    if (existing) {
      return res.status(400).json({ error: 'Un jour férié existe déjà à cette date.' });
    }
    const id = holidayDao.insert({ date, label });
    res.status(201).json({ id, date, label });
  } catch (err) {
    next(err);
  }
}

export async function updateHoliday(req, res, next) {
  try {
    const { id } = req.params;
    const { date, label } = req.body;
    if (!date || !label) {
      return res.status(400).json({ error: 'Champs date et label requis.' });
    }
    // Vérification unicité de la date pour un autre ID
    const existing = holidayDao.getByDate(date);
    if (existing && String(existing.id) !== String(id)) {
      return res.status(400).json({ error: 'Un autre jour férié existe déjà à cette date.' });
    }
    holidayDao.update(Number(id), { date, label });
    res.json({ id: Number(id), date, label });
  } catch (err) {
    next(err);
  }
}

export async function deleteHoliday(req, res, next) {
  try {
    const { id } = req.params;
    holidayDao.delete(Number(id));
    res.json({ success: true, message: 'Jour férié supprimé.' });
  } catch (err) {
    next(err);
  }
}
