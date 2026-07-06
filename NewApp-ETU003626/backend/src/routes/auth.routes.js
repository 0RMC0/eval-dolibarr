import { Router } from 'express';

const router = Router();

// [J1 - 1.a] Vérifie le code backoffice.
// La route est montée derrière requireBackofficeCode : si on arrive ici, le code est valide.
router.get('/verify', (req, res) => {
  res.json({ ok: true });
});

export default router;
