import { toJsDate } from './dates';

/**
 * Calculs de génération de salaires au tarif journalier. [J2 - 2.a]
 * Règles : les jours fériés sont payés double ; les jours déjà couverts par
 * un salaire existant sont exclus. Fonctions pures — utilisées à la fois par
 * l'aperçu et par la génération (un seul endroit à modifier).
 */

// "2026-03" -> { year, monthStr, monthIndex, daysInMonth }.
export function parseMonth(month) {
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  return { year, monthStr, monthIndex, daysInMonth: new Date(year, monthIndex + 1, 0).getDate() };
}

// Date ISO d'un jour du mois : (2026, "03", 8) -> "2026-03-08".
export function dayIso(year, monthStr, day) {
  return `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
}

function stripTime(date) {
  return date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null;
}

// Tableau indexé par jour (1..daysInMonth) : true si le jour est déjà couvert
// par un salaire existant de l'employé.
function paidDaysOfMonth(salaries, empId, { year, monthIndex, daysInMonth }) {
  const paid = new Array(daysInMonth + 1).fill(false);
  const empSalaries = salaries.filter((s) => String(s.fk_user) === String(empId));

  for (const sal of empSalaries) {
    const start = stripTime(toJsDate(sal.datesp));
    const end = stripTime(toJsDate(sal.dateep));
    if (!start || !end) continue;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      if (date >= start && date <= end) paid[day] = true;
    }
  }
  return paid;
}

// Plages de jours consécutifs NON payés du mois : [{ startDay, endDay }].
export function unpaidIntervals(salaries, empId, monthInfo) {
  const paid = paidDaysOfMonth(salaries, empId, monthInfo);
  const intervals = [];
  let startDay = null;

  for (let day = 1; day <= monthInfo.daysInMonth; day++) {
    if (!paid[day] && startDay === null) startDay = day;
    if (paid[day] && startDay !== null) {
      intervals.push({ startDay, endDay: day - 1 });
      startDay = null;
    }
  }
  if (startDay !== null) intervals.push({ startDay, endDay: monthInfo.daysInMonth });
  return intervals;
}

// Nombre de jours fériés dans une plage de jours du mois.
export function countHolidays(holidays, { year, monthStr }, startDay, endDay) {
  let count = 0;
  for (let d = startDay; d <= endDay; d++) {
    if (holidays.some((h) => h.date === dayIso(year, monthStr, d))) count++;
  }
  return count;
}

// Détail d'une plage : jours normaux, fériés (x2) et montant à payer.
export function intervalDetail(interval, holidays, monthInfo, dailyRate) {
  const totalDays = interval.endDay - interval.startDay + 1;
  const holidayDays = countHolidays(holidays, monthInfo, interval.startDay, interval.endDay);
  const normalDays = totalDays - holidayDays;
  return {
    ...interval,
    totalDays,
    holidayDays,
    normalDays,
    amount: normalDays * dailyRate + holidayDays * 2 * dailyRate,
  };
}

// Synthèse mensuelle pour un employé : plages à payer + totaux.
export function monthlySalaryPlan({ salaries, holidays, empId, month, dailyRate }) {
  if (!month) return { intervals: [], normalDays: 0, holidayDays: 0, totalAmount: 0, monthInfo: null };

  const monthInfo = parseMonth(month);
  const intervals = unpaidIntervals(salaries, empId, monthInfo).map((i) =>
    intervalDetail(i, holidays, monthInfo, dailyRate)
  );

  return {
    intervals,
    normalDays: intervals.reduce((sum, i) => sum + i.normalDays, 0),
    holidayDays: intervals.reduce((sum, i) => sum + i.holidayDays, 0),
    totalAmount: intervals.reduce((sum, i) => sum + i.amount, 0),
    monthInfo,
  };
}
