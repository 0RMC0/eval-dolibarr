import { resetData } from '../services/reset.service.js';

/** POST /api/reset — déclenche la réinitialisation. [J1 - 1.b] */
export async function handleReset(req, res, next) {
  try {
    const result = await resetData();
    res.json(result);
  } catch (err) {
    next(err);
  }
}
