import { toJsDate } from './dates';
import { paymentsForSalary, remainingDue } from './payments';

/**
 * Logique de la page "Générer paiements" : quels salaires payer, dans quel
 * ordre, et comment répartir le budget. Fonctions pures (pas de React) :
 * l'aperçu du tableau ET la génération utilisent exactement les mêmes calculs.
 */

// Arrondit à 2 décimales (évite les restes de flottants type 0.0000001).
function round2(n) {
  return Math.round(n * 100) / 100;
}

// Le salaire appartient-il au mois/année sélectionnés ?
// Référence : la date de DÉBUT du salaire (datesp).
function isInMonth(salary, month, year) {
  const date = toJsDate(salary.datesp);
  return date !== null && date.getFullYear() === year && date.getMonth() + 1 === month;
}

/**
 * Étape 1 — Les salaires à payer : ceux du mois/année choisis, appartenant
 * aux employés sélectionnés (filtres), avec un reste à payer > 0.
 * Les salaires déjà entièrement payés sont ignorés (règle métier).
 * Renvoie [{ salary, employee, due, startDate }].
 */
export function unpaidSalariesForMonth({ salaries, payments, employees, month, year }) {
  // Dictionnaire id employé -> employé (clés en String : Dolibarr mélange nombres et chaînes).
  const employeeById = {};
  for (const emp of employees) {
    employeeById[String(emp.id)] = emp;
  }

  const rows = [];
  for (const sal of salaries) {
    const employee = employeeById[String(sal.fk_user)];
    if (!employee) continue; // employé hors des filtres sélectionnés
    if (!isInMonth(sal, month, year)) continue;

    const due = remainingDue(sal.amount, paymentsForSalary(payments, sal.id));
    if (due <= 0.009) continue; // déjà entièrement payé

    rows.push({ salary: sal, employee, due: round2(due), startDate: toJsDate(sal.datesp) });
  }
  return rows;
}

/**
 * Étape 2 — L'ordre de paiement (règle métier stricte) :
 *  1. d'abord TOUS les salaires du poste prioritaire, du plus ancien au plus récent ;
 *  2. puis les autres postes, du plus ancien au plus récent.
 * Cet ordre ne change jamais, même si le budget est insuffisant.
 */
export function orderByPriority(rows, priorityJob) {
  // Tri chronologique par date de début (à date égale : id de salaire croissant).
  const byStartDate = (a, b) =>
    a.startDate - b.startDate || Number(a.salary.id) - Number(b.salary.id);

  const priority = rows.filter((r) => (r.employee.job || '') === priorityJob);
  const others = rows.filter((r) => (r.employee.job || '') !== priorityJob);

  return [...priority.sort(byStartDate), ...others.sort(byStartDate)];
}

/**
 * Étape 3 — Répartition du budget dans l'ordre établi :
 *  - budget suffisant  -> paiement total ;
 *  - budget partiel    -> paiement partiel du montant restant, budget épuisé ;
 *  - budget épuisé     -> non payé.
 * Le reliquat éventuel de budget est simplement ignoré (jamais reporté).
 * Ajoute à chaque ligne : toPay + status ('total' | 'partiel' | 'non payé').
 */
export function allocateBudget(orderedRows, budget) {
  let remaining = budget;

  return orderedRows.map((row) => {
    const toPay = round2(Math.min(row.due, remaining));
    remaining = round2(remaining - toPay);

    let status = 'non payé';
    if (toPay > 0) status = toPay < row.due ? 'partiel' : 'total';

    return { ...row, toPay, status };
  });
}

/** Le plan complet : sélection -> ordre -> répartition du budget. */
export function buildPaymentPlan({ salaries, payments, employees, month, year, priorityJob, budget }) {
  const rows = unpaidSalariesForMonth({ salaries, payments, employees, month, year });
  return allocateBudget(orderByPriority(rows, priorityJob), budget);
}
