/** Helpers de dates partagés (ISO, français, timestamps Dolibarr). */

// Date du jour au format ISO (aaaa-mm-jj) — pour préremplir les champs date.
export function todayIso() {
  return new Date().toISOString().split('T')[0];
}

// "2026-03-08" -> "08/03/2026".
export function isoToFr(iso) {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

// Convertit une valeur renvoyée par Dolibarr (timestamp en secondes, chaîne
// numérique ou date ISO) en objet Date. Renvoie null si vide.
export function toJsDate(value) {
  if (!value) return null;
  if (typeof value === 'number') return new Date(value * 1000);
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return new Date(parseInt(value, 10) * 1000);
  }
  return new Date(value);
}
