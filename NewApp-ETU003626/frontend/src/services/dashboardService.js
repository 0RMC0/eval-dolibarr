import { listSalaries } from './salaryService';
import { listRealEmployees } from './employeeService';
import { toJsDate } from '../utils/dates';

/** Agrégations pour le dashboard. [J1 - 1.d] */

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// Charge salaires + employés UNE seule fois et calcule les deux agrégats.
export async function getDashboardData() {
  const [salaries, employees] = await Promise.all([listSalaries(), listRealEmployees()]);
  return {
    byGender: salaryByGender(salaries, employees),
    byMonth: salaryByMonth(salaries),
  };
}

// Arrondit à 2 décimales (évite les flottants type 1500.0000001).
function round2(n) {
  return parseFloat(n.toFixed(2));
}

// [1.d.I] Montant total de salaire par genre.
function salaryByGender(salaries, employees) {
  // Dictionnaire id employé -> genre ('man' / 'woman' / '').
  const genderById = {};
  for (const emp of employees) {
    genderById[emp.id] = emp.gender;
  }

  // Cumul des montants par genre.
  const totals = { man: 0, woman: 0, other: 0 };
  for (const sal of salaries) {
    const gender = genderById[sal.fk_user];
    const key = gender === 'man' || gender === 'woman' ? gender : 'other';
    totals[key] += parseFloat(sal.amount) || 0;
  }

  // Format attendu par le DonutChart : { name, value, color }.
  const data = [];
  if (totals.man > 0) data.push({ name: 'Homme', value: round2(totals.man), color: 'blue.6' });
  if (totals.woman > 0) data.push({ name: 'Femme', value: round2(totals.woman), color: 'pink.6' });
  if (totals.other > 0) {
    data.push({ name: 'Autre / Non renseigné', value: round2(totals.other), color: 'gray.6' });
  }
  return data;
}

// [1.d.II] Montant total de salaire par mois (référence : date de début).
function salaryByMonth(salaries) {
  // Regroupe par mois : { '24312': { sortKey, label, montant } }.
  const groups = {};

  for (const sal of salaries) {
    const date = toJsDate(sal.datesp);
    if (!date || isNaN(date.getTime())) continue;

    const sortKey = date.getFullYear() * 12 + date.getMonth();
    const label = `${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;

    if (!groups[sortKey]) {
      groups[sortKey] = { sortKey, label, montant: 0 };
    }
    groups[sortKey].montant += parseFloat(sal.amount) || 0;
  }

  // Tri chronologique puis format attendu par le BarChart.
  return Object.values(groups)
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((g) => ({ month: g.label, montant: round2(g.montant) }));
}
