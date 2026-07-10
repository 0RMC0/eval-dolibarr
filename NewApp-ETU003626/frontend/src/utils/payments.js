import { toJsDate } from './dates';

/** Helpers des paiements échelonnés d'un salaire. [J1 - 2.b] */

// Paiements d'un salaire donné, normalisés pour l'affichage.
export function paymentsForSalary(allPayments, salaryId) {
  return allPayments
    .filter((p) => String(p.fk_salary) === String(salaryId))
    .map((p) => ({ date: toJsDate(p.datepaye), montant: parseFloat(p.amount) || 0 }));
}

// Total déjà payé sur une liste de paiements [{ date, montant }].
export function totalPaid(payments = []) {
  return payments.reduce((sum, p) => sum + (Number(p.montant) || 0), 0);
}

// Reste dû par rapport au montant total du salaire.
export function remainingDue(montantTotal, payments = []) {
  return (Number(montantTotal) || 0) - totalPaid(payments);
}

// Statut de paiement d'un salaire : 'payé' | 'partiel' | 'impayé'.
export function paymentStatus(montantTotal, payments = []) {
  const reste = remainingDue(montantTotal, payments);
  if (reste <= 0) return 'payé';
  if (totalPaid(payments) > 0) return 'partiel';
  return 'impayé';
}
