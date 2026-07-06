import { Router } from 'express';
import { handleReset } from '../controllers/reset.controller.js';

const router = Router();

// [J1 - 1.b] Réinitialisation des données (Dolibarr + SQLite).
router.post('/', handleReset);

export default router;
