import { useState } from 'react';
import { Alert, Button, Card, List, Modal, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { resetData } from '../../services/adminService';

export default function ResetData() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runReset = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await resetData();
      setResult(res);
      notifications.show({ color: 'green', message: 'Réinitialisation effectuée.' });
    } catch (err) {
      const message = err.response?.data?.error || err.message;
      notifications.show({ color: 'red', title: 'Échec de la réinitialisation', message });
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <Stack maw={560}>
      <Title order={2}>Réinitialiser les données</Title>
      <Alert color="orange" title="Action irréversible">
        Supprime les employés importés, leurs salaires et paiements dans Dolibarr,
        ainsi que les données locales (SQLite). L’administrateur Dolibarr est préservé.
      </Alert>

      <Button color="red" onClick={() => setConfirmOpen(true)} loading={loading}>
        Réinitialiser les données
      </Button>

      {result && (
        <Card withBorder padding="lg" radius="md">
          <Title order={4} mb="sm">Résultat</Title>
          <List size="sm">
            <List.Item>Paiements supprimés : {result.dolibarr.paiements}</List.Item>
            <List.Item>Salaires supprimés : {result.dolibarr.salaires}</List.Item>
            <List.Item>Employés supprimés : {result.dolibarr.employes}</List.Item>
            <List.Item>Fichiers photo supprimés : {result.dolibarr.fichiers}</List.Item>
            <List.Item>Tables SQLite vidées : {result.sqlite.tablesVidees}</List.Item>
          </List>
        </Card>
      )}

      <Modal opened={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmer">
        <Stack>
          <Text>
            Confirmer la suppression définitive des données importées (Dolibarr + SQLite) ?
          </Text>
          <Button color="red" onClick={runReset} loading={loading}>
            Oui, réinitialiser
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
