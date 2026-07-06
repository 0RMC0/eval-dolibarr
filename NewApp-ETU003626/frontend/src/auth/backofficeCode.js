/**
 * Stockage du code unique global du backoffice.
 * Conservé en sessionStorage : effacé à la fermeture de l'onglet,
 * donc à ressaisir à chaque nouvelle session (conforme au besoin J1 - 1).
 */
const KEY = 'newapp_backoffice_code';

export function getBackofficeCode() {
  return sessionStorage.getItem(KEY) || '';
}

export function setBackofficeCode(code) {
  sessionStorage.setItem(KEY, code);
}

export function clearBackofficeCode() {
  sessionStorage.removeItem(KEY);
}
