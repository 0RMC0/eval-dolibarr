/** Helpers de formatage partagés. */

// Formate un montant en euros (fr-FR).
export function formatAmount(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value) || 0);
}

// Normalise un montant à la française ("677,56") en nombre (677.56).
export function parseAmountFR(value) {
  if (value == null || value === '') return 0;
  return Number(String(value).replace(/\s/g, '').replace(',', '.'));
}

// Formate une date en fr-FR à partir d'une valeur Date/ISO.
export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR');
}
