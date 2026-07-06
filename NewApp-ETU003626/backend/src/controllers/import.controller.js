import { importData } from '../services/import.service.js';

/** POST /api/import — reçoit les 2 CSV + le ZIP de photos et lance l'import. [J1 - 1.c] */
export async function handleImport(req, res, next) {
  try {
    const files = req.files || {};
    const result = await importData({
      employesCsvPath: files.employes?.[0]?.path,
      salairesCsvPath: files.salaires?.[0]?.path,
      imagesZipPath: files.images?.[0]?.path,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
