import { parse } from 'csv-parse/sync';

/**
 * Parse un contenu CSV en tableau d'objets (1ère ligne = en-têtes).
 */
export function parseCsv(content) {
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

/**
 * Normalise un montant à la française ("677,56") en nombre (677.56).
 */
export function parseAmount(value) {
  if (value == null || value === '') return 0;
  return Number(String(value).replace(/\s/g, '').replace(',', '.'));
}
