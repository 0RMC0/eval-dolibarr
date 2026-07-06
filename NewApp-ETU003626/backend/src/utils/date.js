/**
 * Convertit une date française (jj/mm/aaaa ou jj/mm/aa) en ISO (aaaa-mm-jj).
 * Les paiements du CSV utilisent l'année sur 2 chiffres (ex. "08/03/26").
 * Renvoie '' si la valeur est vide/illisible.
 */
export function frToIso(value) {
  if (!value) return '';
  const m = String(value).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return '';
  const [, dd, mm, yy] = m;
  const year = yy.length === 2 ? `20${yy}` : yy;
  return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}
