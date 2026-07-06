import { backend } from '../api/backend';

/**
 * Vérifie un code backoffice candidat auprès du backend. [J1 - 1.a]
 * Renvoie true si le code est valide, false sinon.
 */
export function verifyCode(code) {
  return backend
    .get('/api/auth/verify', { headers: { 'x-backoffice-code': code } })
    .then(() => true)
    .catch(() => false);
}
