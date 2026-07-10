/** Filtrage multi-critères des salariés (recherche, genre, poste, heures). */

// Liste triée des postes distincts — pour alimenter un Select.
export function uniqueJobs(employees) {
  return Array.from(new Set(employees.map((e) => e.job).filter(Boolean))).sort();
}

function matchesSearch(emp, search) {
  if (!search) return true;
  const needle = search.toLowerCase();
  return [emp.lastname, emp.login, emp.job].some((field) =>
    (field || '').toLowerCase().includes(needle)
  );
}

function matchesGender(emp, gender) {
  return !gender || gender === 'all' || emp.gender === gender;
}

function matchesJob(emp, job) {
  return !job || job === 'all' || emp.job === job;
}

function matchesHours(emp, min, max) {
  const hours = parseFloat(emp.weeklyhours) || 0;
  const minVal = parseFloat(min);
  const maxVal = parseFloat(max);
  return (isNaN(minVal) || hours >= minVal) && (isNaN(maxVal) || hours <= maxVal);
}

// Applique tous les critères fournis ; les critères absents sont ignorés.
export function filterEmployees(employees, { search, gender, job, hoursMin, hoursMax } = {}) {
  return employees.filter(
    (emp) =>
      matchesSearch(emp, search) &&
      matchesGender(emp, gender) &&
      matchesJob(emp, job) &&
      matchesHours(emp, hoursMin, hoursMax)
  );
}
