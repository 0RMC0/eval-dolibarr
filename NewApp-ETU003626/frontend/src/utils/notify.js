import { notifications } from '@mantine/notifications';

/** Notifications uniformisées (succès / avertissement / erreur). */

export function notifySuccess(message) {
  notifications.show({ color: 'green', message });
}

export function notifyWarning(message) {
  notifications.show({ color: 'orange', message });
}

// Extrait le message le plus utile d'une erreur axios/JS.
export function errorMessage(err, fallback = 'Une erreur est survenue.') {
  return err?.response?.data?.error || err?.message || fallback;
}

export function notifyError(title, err) {
  notifications.show({ color: 'red', title, message: errorMessage(err) });
}
