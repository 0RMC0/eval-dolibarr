import { dolibarr } from '../api/dolibarr';

/**
 * Employés (salariés) via l'API Dolibarr directe. [J1 - 2.a]
 * Les endpoints exacts seront affinés à l'implémentation de la liste.
 */

// Liste des salariés (recherche multi-critères via `params`).
export function listEmployees(params = {}) {
  return dolibarr.get('/users', { params }).then((r) => r.data);
}

export function getEmployee(id) {
  return dolibarr.get(`/users/${id}`).then((r) => r.data);
}
