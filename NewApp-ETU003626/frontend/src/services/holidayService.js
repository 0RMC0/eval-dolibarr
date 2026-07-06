import { backend } from '../api/backend';

export function listHolidays() {
  return backend.get('/api/holidays').then((r) => r.data);
}

export function createHoliday(holiday) {
  return backend.post('/api/holidays', holiday).then((r) => r.data);
}

export function updateHoliday(id, holiday) {
  return backend.put(`/api/holidays/${id}`, holiday).then((r) => r.data);
}

export function deleteHoliday(id) {
  return backend.delete(`/api/holidays/${id}`).then((r) => r.data);
}
