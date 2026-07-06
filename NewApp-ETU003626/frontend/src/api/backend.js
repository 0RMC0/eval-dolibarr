import axios from 'axios';
import { getBackofficeCode } from '../auth/backofficeCode';

/**
 * Client vers le backend NewApp (reset + import).
 * Injecte automatiquement le code backoffice dans l'en-tête de chaque requête.
 */
export const backend = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

backend.interceptors.request.use((config) => {
  // N'injecte le code stocké que si l'appelant n'a pas déjà fourni un code
  // explicite (cas de la vérification d'un code candidat à la connexion).
  if (!config.headers['x-backoffice-code']) {
    const code = getBackofficeCode();
    if (code) config.headers['x-backoffice-code'] = code;
  }
  return config;
});
