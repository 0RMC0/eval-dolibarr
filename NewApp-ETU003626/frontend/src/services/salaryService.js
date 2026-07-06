import { dolibarr } from '../api/dolibarr';

/**
 * Salaires (module Salaire de Dolibarr) via l'API directe. [J1 - 2.b]
 * Les endpoints exacts seront affinés à l'implémentation.
 */

export function listSalaries(params = {}) {
  return dolibarr.get('/salaries', { params }).then((r) => r.data);
}

// Créer un salaire.
export function createSalary(payload) {
  return dolibarr.post('/salaries', payload).then((r) => r.data);
}

// Ajouter un paiement (paiement en plusieurs fois).
export function addPayment(salaryId, payment) {
  return dolibarr.post(`/salaries/${salaryId}/payments`, payment).then((r) => r.data);
}

// Récupérer la liste des paiements de salaire.
export function listPayments(params = {}) {
  return dolibarr.get('/salaries/payments', { params }).then((r) => r.data);
}

