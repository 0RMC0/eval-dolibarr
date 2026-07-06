/** Helpers d'affichage des paiements échelonnés d'un salaire. [J1 - 2.b] */

// Total déjà payé sur une liste de paiements [{ date, montant }].
export function totalPaid(payments = []) {
  return payments.reduce((sum, p) => sum + (Number(p.montant) || 0), 0);
}

// Reste dû par rapport au montant total du salaire.
export function remainingDue(montantTotal, payments = []) {
  return (Number(montantTotal) || 0) - totalPaid(payments);
}

// Statut de paiement d'un salaire.
export function paymentStatus(montantTotal, payments = []) {
  const reste = remainingDue(montantTotal, payments);
  if (reste <= 0) return 'payé';
  if (totalPaid(payments) > 0) return 'partiel';
  return 'impayé';
}
