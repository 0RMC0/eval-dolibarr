import { listSalaries } from './salaryService';
import { listEmployees } from './employeeService';

/**
 * Agrégations pour le dashboard. [J1 - 1.d]
 * Calcule les totaux à partir des salaires Dolibarr.
 */

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// [1.d.I] Montant de salaire par genre.
export async function getSalaryByGender() {
  const [salaries, employees] = await Promise.all([
    listSalaries(),
    listEmployees()
  ]);

  const empMap = new Map();
  for (const emp of employees) {
    empMap.set(String(emp.id), emp);
  }

  let maleTotal = 0;
  let femaleTotal = 0;
  let otherTotal = 0;

  for (const salary of salaries) {
    const userId = String(salary.fk_user);
    const emp = empMap.get(userId);
    const gender = emp ? String(emp.gender).toLowerCase() : '';
    const amount = parseFloat(salary.amount) || 0;

    if (gender === 'man') {
      maleTotal += amount;
    } else if (gender === 'woman') {
      femaleTotal += amount;
    } else {
      otherTotal += amount;
    }
  }

  const data = [];
  if (maleTotal > 0) {
    data.push({ name: 'Homme', value: parseFloat(maleTotal.toFixed(2)), color: 'blue.6' });
  }
  if (femaleTotal > 0) {
    data.push({ name: 'Femme', value: parseFloat(femaleTotal.toFixed(2)), color: 'pink.6' });
  }
  if (otherTotal > 0) {
    data.push({ name: 'Autre / Non renseigné', value: parseFloat(otherTotal.toFixed(2)), color: 'gray.6' });
  }

  return data;
}

// [1.d.II] Montant de salaire par mois (référence : date de début du salaire).
export async function getSalaryByMonth() {
  const salaries = await listSalaries();

  const groups = {};
  for (const salary of salaries) {
    const datesp = salary.datesp;
    if (!datesp) continue;

    let date;
    if (typeof datesp === 'number') {
      date = new Date(datesp * 1000);
    } else if (typeof datesp === 'string' && /^\d+$/.test(datesp)) {
      date = new Date(parseInt(datesp, 10) * 1000);
    } else {
      date = new Date(datesp);
    }

    if (isNaN(date.getTime())) continue;

    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const sortKey = year * 12 + monthIndex;
    const label = `${MONTHS_FR[monthIndex]} ${year}`;
    const amount = parseFloat(salary.amount) || 0;

    if (!groups[sortKey]) {
      groups[sortKey] = { sortKey, label, montant: 0 };
    }
    groups[sortKey].montant += amount;
  }

  return Object.values(groups)
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((g) => ({
      month: g.label,
      montant: parseFloat(g.montant.toFixed(2)),
    }));
}

