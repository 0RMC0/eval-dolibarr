import { config } from '../config/index.js';

/**
 * Protège les routes backend avec le code unique global du backoffice.
 * Le frontend envoie le code dans l'en-tête `x-backoffice-code`.
 */
export function requireBackofficeCode(req, res, next) {
  const provided = req.get('x-backoffice-code');
  if (!provided || provided !== config.backofficeCode) {
    return res.status(401).json({ error: 'Code backoffice invalide ou manquant.' });
  }
  next();
}
