import { parseAmount } from './csv.js';

/**
 * Parse la colonne `paiement` de la feuille salaires.
 * Format source (non-standard) : {["08/03/26",480],["08/03/26",300]}
 * -> renvoie [{ date: "08/03/26", montant: 480 }, { date: "08/03/26", montant: 300 }]
 * Tolérant : renvoie [] si vide ou illisible.
 */
export function parsePayments(raw) {
  if (!raw || String(raw).trim() === '') return [];

  const paires = [];
  // Capture chaque couple ["date", montant]
  const re = /\[\s*"([^"]+)"\s*,\s*([\d.,]+)\s*\]/g;
  let m;
  while ((m = re.exec(String(raw))) !== null) {
    paires.push({ date: m[1], montant: parseAmount(m[2]) });
  }
  return paires;
}
