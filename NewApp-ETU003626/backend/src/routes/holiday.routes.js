import { Router } from 'express';
import { requireBackofficeCode } from '../middleware/auth.js';
import {
  listHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../controllers/holiday.controller.js';

const router = Router();

// Lecture libre : le frontoffice (génération au tarif journalier) en a besoin.
router.get('/', listHolidays);

// Mutations réservées au backoffice (code unique requis).
router.post('/', requireBackofficeCode, createHoliday);
router.put('/:id', requireBackofficeCode, updateHoliday);
router.delete('/:id', requireBackofficeCode, deleteHoliday);

export default router;
