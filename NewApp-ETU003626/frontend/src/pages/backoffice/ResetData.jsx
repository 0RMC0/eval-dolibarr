import { useState } from 'react';
import { Alert, Button, Card, List, Stack, Title } from '@mantine/core';
import { resetData } from '../../services/adminService';
import { notifyError, notifySuccess } from '../../utils/notify';
import ConfirmModal from '../../components/ConfirmModal';

// [J1 - 1.b] Réinitialisation des données (Dolibarr + SQLite) via le backend.
export default function ResetData() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runReset = async () => {
    setLoading(true);
    setResult(null);
    try {
      setResult(await resetData());
      notifySuccess('Réinitialisation effectuée.');
    } catch (err) {
      notifyError('Échec de la réinitialisation', err);
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

      {result && <ResetReport result={result} />}

      <ConfirmModal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={runReset}
        confirmLabel="Oui, réinitialiser"
        loading={loading}
      >
        Confirmer la suppression définitive des données importées (Dolibarr + SQLite) ?
      </ConfirmModal>
    </Stack>
  );
}

/** Compteurs de suppression renvoyés par le backend. */
function ResetReport({ result }) {
  return (
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
  );
}
