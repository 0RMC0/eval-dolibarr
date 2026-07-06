import axios from 'axios';

/**
 * Client vers l'API REST Dolibarr, appelée DIRECTEMENT depuis le frontend.
 * Sert pour : liste salariés, création/paiement de salaire, dashboard.
 */
export const dolibarr = axios.create({
  baseURL: import.meta.env.VITE_DOLIBARR_URL,
  headers: {
    DOLAPIKEY: import.meta.env.VITE_DOLIBARR_API_KEY,
    'Content-Type': 'application/json',
  },
});
