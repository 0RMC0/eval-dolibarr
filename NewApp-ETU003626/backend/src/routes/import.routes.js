import { Router } from 'express';
import multer from 'multer';
import { handleImport } from '../controllers/import.controller.js';

const upload = multer({ dest: 'uploads/' });

const router = Router();

// [J1 - 1.c] Import : 2 CSV (employés, salaires) + 1 ZIP de photos.
// Champs multipart : employes (csv), salaires (csv), images (zip)
router.post(
  '/',
  upload.fields([
    { name: 'employes', maxCount: 1 },
    { name: 'salaires', maxCount: 1 },
    { name: 'images', maxCount: 1 },
  ]),
  handleImport
);

export default router;
