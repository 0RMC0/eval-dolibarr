import { useEffect, useState } from 'react';
import {
  Title,
  Text,
  Table,
  Button,
  Modal,
  TextInput,
  Stack,
  Group,
  Card,
  Center,
  Loader,
  Alert,
  ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  listHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../../services/holidayService';
import { formatDate } from '../../utils/format';

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form / Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null); // null for create, object for edit
  const [date, setDate] = useState('');
  const [label, setLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listHolidays();
      setHolidays(data);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les jours fériés.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingHoliday(null);
    setDate('');
    setLabel('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (holiday) => {
    setEditingHoliday(holiday);
    setDate(holiday.date);
    setLabel(holiday.label);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !label) {
      notifications.show({ color: 'orange', message: 'Veuillez remplir tous les champs.' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingHoliday) {
        await updateHoliday(editingHoliday.id, { date, label });
        notifications.show({ color: 'green', message: 'Jour férié mis à jour.' });
      } else {
        await createHoliday({ date, label });
        notifications.show({ color: 'green', message: 'Jour férié créé.' });
      }
      setModalOpen(false);
      await fetchHolidays();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || 'Une erreur est survenue.';
      notifications.show({
        color: 'red',
        title: 'Erreur',
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteConfirm = (holiday) => {
    setHolidayToDelete(holiday);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!holidayToDelete) return;
    setDeleting(true);
    try {
      await deleteHoliday(holidayToDelete.id);
      notifications.show({ color: 'green', message: 'Jour férié supprimé.' });
      setDeleteConfirmOpen(false);
      await fetchHolidays();
    } catch (err) {
      console.error(err);
      notifications.show({
        color: 'red',
        title: 'Erreur de suppression',
        message: err.message || 'Une erreur est survenue.',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading && holidays.length === 0) {
    return (
      <Center style={{ height: '70vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} mb="xs">Gestion des jours fériés</Title>
          <Text c="dimmed">
            Configurez les jours fériés de l'entreprise
          </Text>
        </div>
        <Button onClick={handleOpenCreateModal} color="blue">
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
                      <Button
                        size="xs"
                        variant="subtle"
                        color="blue"
                        onClick={() => handleOpenEditModal(h)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => handleOpenDeleteConfirm(h)}
                      >
                        Supprimer
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Modal de création / modification */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingHoliday ? 'Modifier le jour férié' : 'Ajouter un jour férié'}
        size="sm"
      >
        <form onSubmit={handleSubmit}>
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
              <Button variant="light" color="gray" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" loading={submitting}>
                {editingHoliday ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <Stack>
          <Text size="sm">
            Voulez-vous vraiment supprimer le jour férié{' '}
            <strong>{holidayToDelete?.label}</strong> ({holidayToDelete && formatDate(holidayToDelete.date)}) ?
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={() => setDeleteConfirmOpen(false)}>
              Annuler
            </Button>
            <Button color="red" onClick={handleDelete} loading={deleting}>
              Oui, supprimer
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
