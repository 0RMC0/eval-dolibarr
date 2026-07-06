import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Title,
  Text,
  Select,
  TextInput,
  Button,
  Table,
  Badge,
  Modal,
  Stack,
  Group,
  Card,
  Grid,
  Alert,
  Loader,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { listEmployees } from '../../services/employeeService';
import {
  listSalaries,
  createSalary,
  addPayment,
  listPayments,
} from '../../services/salaryService';
import EmployeeAvatar from '../../components/EmployeeAvatar';
import { formatAmount, formatDate } from '../../utils/format';
import { totalPaid, remainingDue, paymentStatus } from '../../utils/payments';

export default function SalaryCreate() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEmployeeId = searchParams.get('employeeId') || '';

  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEmployeeId);

  // New salary form state
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [amount, setAmount] = useState('');
  const [creating, setCreating] = useState(false);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const loadData = async () => {
    try {
      const [empData, salData, payData] = await Promise.all([
        listEmployees(),
        listSalaries(),
        listPayments(),
      ]);
      // Filter real employees only
      const realEmployees = empData.filter((u) => u.ref_employee && u.employee === '1');
      setEmployees(realEmployees);
      setSalaries(salData);
      setPayments(payData);
    } catch (err) {
      console.error(err);
      notifications.show({
        color: 'red',
        title: 'Erreur',
        message: 'Impossible de récupérer les données depuis Dolibarr.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selected employee if URL parameter changes
  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmployeeId(initialEmployeeId);
    }
  }, [initialEmployeeId]);

  const selectedEmployee = employees.find((e) => String(e.id) === selectedEmployeeId);

  // Filter salaries for selected employee
  const employeeSalaries = salaries.filter(
    (s) => String(s.fk_user) === selectedEmployeeId
  );

  const getSalaryPayments = (salaryId) => {
    return payments
      .filter((p) => String(p.fk_salary) === String(salaryId))
      .map((p) => ({
        date: p.datepaye * 1000,
        montant: parseFloat(p.amount) || 0,
      }));
  };

  const handleCreateSalary = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId || !dateDebut || !dateFin || !amount) {
      notifications.show({
        color: 'orange',
        message: 'Veuillez remplir tous les champs.',
      });
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      notifications.show({
        color: 'orange',
        message: 'Le montant doit être supérieur à 0.',
      });
      return;
    }

    setCreating(true);
    try {
      const formatDateFR = (dateStr) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      };

      const payload = {
        fk_user: Number(selectedEmployeeId),
        label: `Salaire du ${formatDateFR(dateDebut)} au ${formatDateFR(dateFin)}`,
        amount: val,
        datesp: dateDebut, // YYYY-MM-DD
        dateep: dateFin, // YYYY-MM-DD
      };

      await createSalary(payload);
      notifications.show({
        color: 'green',
        message: 'Le salaire a été créé avec succès.',
      });
      
      // Reset form
      setDateDebut('');
      setDateFin('');
      setAmount('');
      
      // Reload lists
      await loadData();
    } catch (err) {
      console.error(err);
      notifications.show({
        color: 'red',
        title: 'Échec de la création',
        message: err.message || 'Une erreur est survenue.',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleOpenPaymentModal = (salary) => {
    setSelectedSalary(salary);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentModalOpen(true);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!selectedSalary || !paymentDate || !paymentAmount) {
      notifications.show({
        color: 'orange',
        message: 'Veuillez renseigner la date et le montant.',
      });
      return;
    }

    const payVal = parseFloat(paymentAmount);
    if (isNaN(payVal) || payVal <= 0) {
      notifications.show({
        color: 'orange',
        message: 'Le montant doit être supérieur à 0.',
      });
      return;
    }

    const salPayments = getSalaryPayments(selectedSalary.id);
    const due = remainingDue(selectedSalary.amount, salPayments);
    if (payVal > parseFloat(due.toFixed(2))) {
      notifications.show({
        color: 'orange',
        message: `Le paiement dépasse le reste à payer (${formatAmount(due)}).`,
      });
      return;
    }

    setPaying(true);
    try {
      const payload = {
        paiementtype: 2, // LIQ
        fk_typepayment: 2,
        chid: Number(selectedSalary.id),
        datepaye: paymentDate,
        amounts: { [selectedSalary.id]: payVal },
      };

      await addPayment(selectedSalary.id, payload);
      notifications.show({
        color: 'green',
        message: 'Le paiement a été enregistré avec succès.',
      });
      setPaymentModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      notifications.show({
        color: 'red',
        title: 'Échec de l\'enregistrement',
        message: err.message || 'Une erreur est survenue.',
      });
    } finally {
      setPaying(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'payé':
        return <Badge color="green">Payé</Badge>;
      case 'partiel':
        return <Badge color="orange">Partiel</Badge>;
      default:
        return <Badge color="red">Impayé</Badge>;
    }
  };

  if (loading) {
    return (
      <Center style={{ height: '70vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">Gestion des salaires</Title>
        <Text c="dimmed">
          Attribuez des salaires et enregistrez des paiements échelonnés
        </Text>
      </div>

      <Grid>
        {/* Colonne de gauche : Sélection salarié + historique */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="md">
            <Card withBorder padding="lg" radius="md">
              <Select
                label="Sélectionner un salarié"
                placeholder="Choisissez un employé..."
                value={selectedEmployeeId}
                onChange={(val) => {
                  setSelectedEmployeeId(val || '');
                  setSearchParams(val ? { employeeId: val } : {});
                }}
                data={employees.map((e) => ({
                  value: String(e.id),
                  label: `${e.lastname} (@${e.login})`,
                }))}
                searchable
                clearable
              />

              {selectedEmployee && (
                <Group mt="lg" gap="md">
                  <EmployeeAvatar
                    userId={selectedEmployee.id}
                    photo={selectedEmployee.photo}
                    name={selectedEmployee.lastname}
                    size={50}
                  />
                  <div>
                    <Text fw={700} size="md">
                      {selectedEmployee.lastname}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {selectedEmployee.job || 'Poste non défini'} —{' '}
                      {selectedEmployee.weeklyhours
                        ? `${parseFloat(selectedEmployee.weeklyhours)}h / semaine`
                        : 'Temps non spécifié'}
                    </Text>
                  </div>
                </Group>
              )}
            </Card>

            {selectedEmployeeId && (
              <Card withBorder padding="lg" radius="md">
                <Title order={4} mb="md">
                  Historique des salaires de {selectedEmployee?.lastname}
                </Title>

                {employeeSalaries.length === 0 ? (
                  <Text c="dimmed" size="sm">
                    Aucun salaire enregistré pour ce collaborateur.
                  </Text>
                ) : (
                  <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Période</Table.Th>
                        <Table.Th style={{ textAlign: 'right' }}>Montant</Table.Th>
                        <Table.Th style={{ textAlign: 'right' }}>Payé</Table.Th>
                        <Table.Th style={{ textAlign: 'right' }}>Reste</Table.Th>
                        <Table.Th style={{ textAlign: 'center' }}>Statut</Table.Th>
                        <Table.Th></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {employeeSalaries.map((sal) => {
                        const salPayments = getSalaryPayments(sal.id);
                        const paid = totalPaid(salPayments);
                        const due = remainingDue(sal.amount, salPayments);
                        const status = paymentStatus(sal.amount, salPayments);

                        return (
                          <Table.Tr key={sal.id}>
                            <Table.Td size="xs">
                              {formatDate(sal.datesp * 1000)} au {formatDate(sal.dateep * 1000)}
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'right' }} size="sm">
                              {formatAmount(sal.amount)}
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'right' }} size="sm" c="dimmed">
                              {formatAmount(paid)}
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'right' }} size="sm" fw={due > 0 ? 600 : 400}>
                              {formatAmount(due)}
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'center' }}>
                              {getStatusBadge(status)}
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'right' }}>
                              {due > 0 && (
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="orange"
                                  onClick={() => handleOpenPaymentModal(sal)}
                                >
                                  Payer
                                </Button>
                              )}
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                )}
              </Card>
            )}
          </Stack>
        </Grid.Col>

        {/* Colonne de droite : Formulaire de création */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={4} mb="md">Créer un nouveau salaire</Title>

            {!selectedEmployeeId ? (
              <Alert color="blue" title="Information">
                Veuillez sélectionner un salarié dans la colonne de gauche pour pouvoir lui attribuer un salaire.
              </Alert>
            ) : (
              <form onSubmit={handleCreateSalary}>
                <Stack gap="md">
                  <TextInput
                    label="Date de début"
                    type="date"
                    required
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.currentTarget.value)}
                  />

                  <TextInput
                    label="Date de fin"
                    type="date"
                    required
                    value={dateFin}
                    onChange={(e) => setDateFin(e.currentTarget.value)}
                  />

                  <TextInput
                    label="Montant brut (€)"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1500.00"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.currentTarget.value)}
                  />

                  <Button type="submit" loading={creating} mt="md">
                    Attribuer le salaire
                  </Button>
                </Stack>
              </form>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Modal de paiement */}
      {selectedSalary && (
        <Modal
          opened={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title={`Enregistrer un paiement pour ${selectedEmployee?.lastname}`}
          size="md"
        >
          <form onSubmit={handleAddPayment}>
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm">Salaire total :</Text>
                <Text fw={700}>{formatAmount(selectedSalary.amount)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Reste à payer :</Text>
                <Text fw={700} c="orange">
                  {formatAmount(
                    remainingDue(selectedSalary.amount, getSalaryPayments(selectedSalary.id))
                  )}
                </Text>
              </Group>

              <TextInput
                label="Date de paiement"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.currentTarget.value)}
              />

              <TextInput
                label="Montant du paiement (€)"
                type="number"
                step="0.01"
                required
                placeholder="Saisissez le montant..."
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.currentTarget.value)}
              />

              <Group justify="flex-end" mt="md">
                <Button variant="light" color="gray" onClick={() => setPaymentModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" color="green" loading={paying}>
                  Confirmer le paiement
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      )}
    </Stack>
  );
}
