import { Badge } from '@mantine/core';

const STYLES = {
  payé: { color: 'green', label: 'Payé' },
  partiel: { color: 'orange', label: 'Partiel' },
  impayé: { color: 'red', label: 'Impayé' },
};

/** Badge de statut de paiement d'un salaire ('payé' | 'partiel' | 'impayé'). */
export default function PaymentStatusBadge({ status }) {
  const style = STYLES[status] || STYLES['impayé'];
  return <Badge color={style.color}>{style.label}</Badge>;
}
