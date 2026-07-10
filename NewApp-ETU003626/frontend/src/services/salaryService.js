import { dolibarr } from '../api/dolibarr';
import { isoToFr } from '../utils/dates';

/**
 * Salaires (module Salaire de Dolibarr) via l'API directe. [J1 - 2.b]
 * Seul endroit du frontend qui connaît le format exact des payloads Dolibarr.
 */

// Type de paiement appliqué à tous les paiements (2 = LIQ / espèces).
const PAYMENT_TYPE_ID = 2;

export function listSalaries(params = {}) {
  return dolibarr.get('/salaries', { params }).then((r) => r.data);
}

// Liste de tous les paiements de salaire.
export function listPayments(params = {}) {
  return dolibarr.get('/salaries/payments', { params }).then((r) => r.data);
}

// Création brute d'un salaire (payload Dolibarr complet).
export function createSalary(payload) {
  return dolibarr.post('/salaries', payload).then((r) => r.data);
}

// Crée un salaire pour une période (dates ISO aaaa-mm-jj).
// `labelSuffix` permet d'ajouter un détail au libellé (ex. jours fériés).
export function createPeriodSalary({ userId, startIso, endIso, amount, labelSuffix = '' }) {
  return createSalary({
    fk_user: Number(userId),
    label: `Salaire du ${isoToFr(startIso)} au ${isoToFr(endIso)}${labelSuffix}`,
    amount,
    datesp: startIso,
    dateep: endIso,
  });
}

// Enregistre un paiement (partiel) sur un salaire — paiement en plusieurs fois.
// Construit le payload attendu par l'API Dolibarr (voir HANDOFF §5).
export function addPayment(salaryId, { dateIso, amount }) {
  return dolibarr
    .post(`/salaries/${salaryId}/payments`, {
      paiementtype: PAYMENT_TYPE_ID,
      fk_typepayment: PAYMENT_TYPE_ID,
      chid: Number(salaryId),
      datepaye: dateIso,
      amounts: { [salaryId]: amount },
    })
    .then((r) => r.data);
}
