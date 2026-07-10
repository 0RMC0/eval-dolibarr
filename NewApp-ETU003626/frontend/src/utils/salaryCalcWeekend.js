import { parseMonth, dayIso, unpaidIntervals } from './salaryCalc';

/**
 * Variante de salaryCalc.js avec majoration WEEK-END (page "tarif journalier + week-end").
 *
 * Règles par jour (tarif = tarif journalier de base) :
 *  - jour normal en semaine ............................. x1
 *  - jour férié (semaine) ............................... x2
 *  - samedi/dimanche COCHÉ (majoration) ................. x3
 *  - samedi/dimanche COCHÉ + férié ...................... x3  (le tarif week-end prend le dessus)
 *  - samedi/dimanche NON coché .......................... 0x  (non payé)
 *
 * `weekend` = { saturday: bool, sunday: bool } (cases à cocher de la page).
 */

// Un jour du mois est-il férié ?
function isHolidayDay(holidays, year, monthStr, day) {
  return holidays.some((h) => h.date === dayIso(year, monthStr, day));
}

/**
 * Multiplicateur de tarif d'UN jour donné.
 * @param {Date} date    - le jour (pour connaître samedi/dimanche)
 * @param {boolean} isHoliday
 * @param {{saturday:boolean, sunday:boolean}} weekend - cases cochées
 * @returns {number} multiplicateur appliqué au tarif journalier (0 = non payé)
 */
export function dayMultiplier(date, isHoliday, weekend) {
  const dow = date.getDay(); // 0 = dimanche, 6 = samedi
  const isSaturday = dow === 6;
  const isSunday = dow === 0;

  // La majoration week-end s'applique-t-elle à CE jour (case cochée) ?
  const weekendBoost = (isSaturday && weekend.saturday) || (isSunday && weekend.sunday);

  // ─── ALTERNATIVE 1 (prête à décommenter) ────────────────────────────────
  // Ne PAS payer les jours de week-end dont la case n'est pas cochée.
  // Par défaut (ci-dessous), ces jours sont payés au tarif NORMAL (x1).
  if ((isSaturday && !weekend.saturday) || (isSunday && !weekend.sunday)) {
    return 0;
  }
  // ────────────────────────────────────────────────────────────────────────

  // Défaut : MULTIPLICATIF → week-end majoré (x3) PUIS férié (x2) = x6.
  // let mult = 1;
  // if (weekendBoost) mult *= 3;
  // if (isHoliday) mult *= 2;
  // return mult;

  // ─── ALTERNATIVE 2 (prête à décommenter) ────────────────────────────────
  // ADDITION au lieu de multiplication : week-end (x3) + férié (x2) = x5.
  // Remplacer les 4 lignes ci-dessus (let mult ... return mult) par :
  // Changement en x3 prends le dessus sur x2
  let mult;
  if (weekendBoost && isHoliday) mult = 3; 
  else if (weekendBoost) mult = 3;
  else if (isHoliday) mult = 2;
  else mult = 1;
  return mult;
  // ────────────────────────────────────────────────────────────────────────
}

// Détail d'une plage : compte les jours par catégorie et calcule le montant
// jour par jour (car chaque jour peut avoir une majoration différente).
export function intervalDetail(interval, holidays, monthInfo, dailyRate, weekend) {
  const { year, monthStr, monthIndex } = monthInfo;
  let amount = 0;
  let normalDays = 0;
  let holidayDays = 0;
  let weekendDays = 0;

  for (let day = interval.startDay; day <= interval.endDay; day++) {
    const date = new Date(year, monthIndex, day);
    const holiday = isHolidayDay(holidays, year, monthStr, day);
    const dow = date.getDay();
    const weekendBoost = (dow === 6 && weekend.saturday) || (dow === 0 && weekend.sunday);

    amount += dayMultiplier(date, holiday, weekend) * dailyRate;

    // Comptages pour l'affichage (un jour week-end+férié compte dans les deux).
    if (holiday) holidayDays++;
    if (weekendBoost) weekendDays++;
    if (!holiday && !weekendBoost) normalDays++;
  }

  return {
    ...interval,
    totalDays: interval.endDay - interval.startDay + 1,
    normalDays,
    holidayDays,
    weekendDays,
    amount,
  };
}

// Synthèse mensuelle pour un employé : plages à payer + totaux (avec week-end).
export function monthlySalaryPlan({ salaries, holidays, empId, month, dailyRate, weekend }) {
  if (!month) {
    return { intervals: [], normalDays: 0, holidayDays: 0, weekendDays: 0, totalAmount: 0, monthInfo: null };
  }

  const monthInfo = parseMonth(month);
  const intervals = unpaidIntervals(salaries, empId, monthInfo).map((i) =>
    intervalDetail(i, holidays, monthInfo, dailyRate, weekend)
  );

  return {
    intervals,
    normalDays: intervals.reduce((sum, i) => sum + i.normalDays, 0),
    holidayDays: intervals.reduce((sum, i) => sum + i.holidayDays, 0),
    weekendDays: intervals.reduce((sum, i) => sum + i.weekendDays, 0),
    totalAmount: intervals.reduce((sum, i) => sum + i.amount, 0),
    monthInfo,
  };
}
