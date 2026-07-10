import { dolibarr } from '../api/dolibarr';

/** Employés (salariés) via l'API Dolibarr directe. [J1 - 2.a] */

// Liste brute des utilisateurs Dolibarr.
export function listEmployees(params = {}) {
  return dolibarr.get('/users', { params }).then((r) => r.data);
}

// Ne garde que les vrais salariés (issus de l'import : réf. employé renseignée).
export function onlyRealEmployees(users) {
  return users.filter((u) => u.ref_employee && u.employee === '1');
}

// Liste des salariés réels uniquement — utilisée par toutes les pages.
export function listRealEmployees() {
  return listEmployees().then(onlyRealEmployees);
}

export function getEmployee(id) {
  return dolibarr.get(`/users/${id}`).then((r) => r.data);
}
