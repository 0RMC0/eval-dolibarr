import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  listHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../../services/holidayService';
import { formatDate } from '../../utils/format';
import { notifyError, notifySuccess, notifyWarning } from '../../utils/notify';
import { useAsyncLoad } from '../../hooks/useAsyncLoad';
import { LoadingScreen } from '../../components/PageStates';
import ConfirmModal from '../../components/ConfirmModal';

// [J2 - 1.b] CRUD des jours fériés (stockés dans la base SQLite du backend).
export default function Holidays() {
  const [holidays, setHolidays] = useState([]);

  // null = fermé, {} = création, objet existant = modification.
  const [editing, setEditing] = useState(null);
  // Jour férié en attente de confirmation de suppression.
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { loading, error, reload } = useAsyncLoad(async () => {
    setHolidays(await listHolidays());
  }, 'Impossible de charger les jours fériés.');

  const handleSave = async ({ date, label }) => {
    try {
      if (editing?.id) {
        await updateHoliday(editing.id, { date, label });
        notifySuccess('Jour férié mis à jour.');
      } else {
        await createHoliday({ date, label });
        notifySuccess('Jour férié créé.');
      }
      setEditing(null);
      await reload();
    } catch (err) {
      notifyError('Erreur', err);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteHoliday(toDelete.id);
      notifySuccess('Jour férié supprimé.');
      setToDelete(null);
      await reload();
    } catch (err) {
      notifyError('Erreur de suppression', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} mb="xs">Gestion des jours fériés</Title>
          <Text c="dimmed">Configurez les jours fériés de l'entreprise</Text>
        </div>
        <Button onClick={() => setEditing({})} color="blue">
          Ajouter un jour férié
        </Button>
      </Group>

      {error && (
        <Alert color="red" title="Erreur">
          {error}
        </Alert>
      )}

      <Card withBorder padding="lg" radius="md">
        {holidays.length === 0 ? (
          <Text c="dimmed" style={{ textAlign: 'center' }} py="xl">
            Aucun jour férié configuré pour le moment.
          </Text>
        ) : (
          <HolidayTable holidays={holidays} onEdit={setEditing} onDelete={setToDelete} />
        )}
      </Card>

      {editing !== null && (
        <HolidayFormModal holiday={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}

      <ConfirmModal
        opened={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        confirmLabel="Oui, supprimer"
        loading={deleting}
      >
        Voulez-vous vraiment supprimer le jour férié{' '}
        <strong>{toDelete?.label}</strong> ({toDelete && formatDate(toDelete.date)}) ?
      </ConfirmModal>
    </Stack>
  );
}

/** Tableau des jours fériés avec actions Modifier / Supprimer. */
function HolidayTable({ holidays, onEdit, onDelete }) {
  return (
    <Table striped highlightOnHover verticalSpacing="sm">
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ width: '150px' }}>Date</Table.Th>
          <Table.Th>Libellé</Table.Th>
          <Table.Th style={{ width: '200px', textAlign: 'right' }}>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {holidays.map((h) => (
          <Table.Tr key={h.id}>
            <Table.Td fw={500}>{formatDate(h.date)}</Table.Td>
            <Table.Td>{h.label}</Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>
              <Group gap="xs" justify="flex-end">
                <Button size="xs" variant="subtle" color="blue" onClick={() => onEdit(h)}>
                  Modifier
                </Button>
                <Button size="xs" variant="subtle" color="red" onClick={() => onDelete(h)}>
                  Supprimer
                </Button>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

/** Formulaire de création / modification d'un jour férié. */
function HolidayFormModal({ holiday, onClose, onSave }) {
  const isEdit = Boolean(holiday.id);
  const [date, setDate] = useState(holiday.date || '');
  const [label, setLabel] = useState(holiday.label || '');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!date || !label) {
      notifyWarning('Veuillez remplir tous les champs.');
      return;
    }
    setSubmitting(true);
    await onSave({ date, label });
    setSubmitting(false);
  };

  return (
    <Modal opened onClose={onClose} title={isEdit ? 'Modifier le jour férié' : 'Ajouter un jour férié'} size="sm">
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput
            label="Date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.currentTarget.value)}
          />

          <TextInput
            label="Libellé"
            placeholder="Ex: Lundi de Pâques"
            required
            value={label}
            onChange={(e) => setLabel(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
