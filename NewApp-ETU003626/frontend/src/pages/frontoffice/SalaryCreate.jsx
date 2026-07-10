import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Grid,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { listRealEmployees } from '../../services/employeeService';
import {
  addPayment,
  createPeriodSalary,
  listPayments,
  listSalaries,
} from '../../services/salaryService';
import { paymentsForSalary, totalPaid, remainingDue, paymentStatus } from '../../utils/payments';
import { formatAmount, formatDate } from '../../utils/format';
import { toJsDate, todayIso } from '../../utils/dates';
import { notifyError, notifySuccess, notifyWarning } from '../../utils/notify';
import { useAsyncLoad } from '../../hooks/useAsyncLoad';
import { LoadingScreen, PageError } from '../../components/PageStates';
import PaymentStatusBadge from '../../components/PaymentStatusBadge';
import EmployeeAvatar from '../../components/EmployeeAvatar';

// [J1 - 2.b] Créer un salaire et le payer en plusieurs fois.
export default function SalaryCreate() {
  // L'employé sélectionné est stocké dans l'URL (?employeeId=...) : une seule
  // source de vérité, et le lien "payer" depuis la liste des salariés marche direct.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedEmployeeId = searchParams.get('employeeId') || '';

  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [payments, setPayments] = useState([]);

  // Salaire en cours de paiement (null = modale fermée).
  const [salaryToPay, setSalaryToPay] = useState(null);

  const { loading, error, reload } = useAsyncLoad(async () => {
    const [empData, salData, payData] = await Promise.all([
      listRealEmployees(),
      listSalaries(),
      listPayments(),
    ]);
    setEmployees(empData);
    setSalaries(salData);
    setPayments(payData);
  }, 'Impossible de récupérer les données depuis Dolibarr.');

  const selectedEmployee = employees.find((e) => String(e.id) === selectedEmployeeId);
  const employeeSalaries = salaries.filter((s) => String(s.fk_user) === selectedEmployeeId);

  // Changer d'employé = changer l'URL (l'état se met à jour tout seul).
  const selectEmployee = (val) => {
    setSearchParams(val ? { employeeId: val } : {});
  };

  // Renvoie true si la création a réussi : le formulaire (NewSalaryForm)
  // s'en sert pour savoir s'il doit vider ses champs.
  const handleCreateSalary = async ({ dateDebut, dateFin, amount }) => {
    try {
      await createPeriodSalary({
        userId: selectedEmployeeId,
        startIso: dateDebut,
        endIso: dateFin,
        amount,
      });
      notifySuccess('Le salaire a été créé avec succès.');
      await reload();
      return true;
    } catch (err) {
      notifyError('Échec de la création', err);
      return false;
    }
  };

  const handleAddPayment = async ({ dateIso, amount }) => {
    try {
      await addPayment(salaryToPay.id, { dateIso, amount });
      notifySuccess('Le paiement a été enregistré avec succès.');
      setSalaryToPay(null);
      await reload();
    } catch (err) {
      notifyError("Échec de l'enregistrement", err);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <PageError title="Gestion des salaires">{error}</PageError>;

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">Gestion des salaires</Title>
        <Text c="dimmed">
          Attribuez des salaires et enregistrez des paiements échelonnés
        </Text>
      </div>

      <Grid>
        {/* Colonne de gauche : sélection salarié + historique */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="md">
            <Card withBorder padding="lg" radius="md">
              <Select
                label="Sélectionner un salarié"
                placeholder="Choisissez un employé..."
                value={selectedEmployeeId}
                onChange={selectEmployee}
                data={employees.map((e) => ({
                  value: String(e.id),
                  label: `${e.lastname} (@${e.login})`,
                }))}
                searchable
                clearable
              />
              {selectedEmployee && <EmployeeSummary employee={selectedEmployee} />}
            </Card>

            {selectedEmployeeId && (
              <SalaryHistoryCard
                title={`Historique des salaires de ${selectedEmployee?.lastname}`}
                salaries={employeeSalaries}
                payments={payments}
                onPay={setSalaryToPay}
              />
            )}
          </Stack>
        </Grid.Col>

        {/* Colonne de droite : formulaire de création */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={4} mb="md">Créer un nouveau salaire</Title>
            {!selectedEmployeeId ? (
              <Alert color="blue" title="Information">
                Veuillez sélectionner un salarié dans la colonne de gauche pour pouvoir lui attribuer un salaire.
              </Alert>
            ) : (
              <NewSalaryForm onSubmit={handleCreateSalary} />
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* La modale n'est montée que si un salaire est sélectionné : ses champs
          repartent donc de zéro à chaque ouverture (pas besoin de les vider). */}
      {salaryToPay && (
        <PaymentModal
          salary={salaryToPay}
          employeeName={selectedEmployee?.lastname}
          payments={paymentsForSalary(payments, salaryToPay.id)}
          onClose={() => setSalaryToPay(null)}
          onSubmit={handleAddPayment}
        />
      )}
    </Stack>
  );
}

/** Avatar + poste + heures du salarié sélectionné. */
function EmployeeSummary({ employee }) {
  return (
    <Group mt="lg" gap="md">
      <EmployeeAvatar userId={employee.id} photo={employee.photo} name={employee.lastname} size={50} />
      <div>
        <Text fw={700} size="md">{employee.lastname}</Text>
        <Text size="xs" c="dimmed">
          {employee.job || 'Poste non défini'} —{' '}
          {employee.weeklyhours
            ? `${parseFloat(employee.weeklyhours)}h / semaine`
            : 'Temps non spécifié'}
        </Text>
      </div>
    </Group>
  );
}

/** Tableau des salaires d'un employé avec état de paiement et bouton Payer. */
function SalaryHistoryCard({ title, salaries, payments, onPay }) {
  return (
    <Card withBorder padding="lg" radius="md">
      <Title order={4} mb="md">{title}</Title>

      {salaries.length === 0 ? (
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
            {salaries.map((sal) => {
              const salPayments = paymentsForSalary(payments, sal.id);
              const paid = totalPaid(salPayments);
              const due = remainingDue(sal.amount, salPayments);

              return (
                <Table.Tr key={sal.id}>
                  <Table.Td size="xs">
                    {formatDate(toJsDate(sal.datesp))} au {formatDate(toJsDate(sal.dateep))}
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
                    <PaymentStatusBadge status={paymentStatus(sal.amount, salPayments)} />
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    {due > 0 && (
                      <Button size="xs" variant="light" color="orange" onClick={() => onPay(sal)}>
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
  );
}

/** Formulaire de création d'un salaire (période + montant). */
function NewSalaryForm({ onSubmit }) {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [amount, setAmount] = useState('');
  const [creating, setCreating] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!dateDebut || !dateFin || !amount) {
      notifyWarning('Veuillez remplir tous les champs.');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      notifyWarning('Le montant doit être supérieur à 0.');
      return;
    }

    setCreating(true);
    const ok = await onSubmit({ dateDebut, dateFin, amount: val });
    setCreating(false);
    if (ok) {
      setDateDebut('');
      setDateFin('');
      setAmount('');
    }
  };

  return (
    <form onSubmit={submit}>
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
  );
}

/** Modale d'enregistrement d'un paiement partiel sur un salaire. */
function PaymentModal({ salary, employeeName, payments, onClose, onSubmit }) {
  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const due = remainingDue(salary.amount, payments);

  const submit = async (e) => {
    e.preventDefault();
    if (!date || !amount) {
      notifyWarning('Veuillez renseigner la date et le montant.');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      notifyWarning('Le montant doit être supérieur à 0.');
      return;
    }
    if (val > parseFloat(due.toFixed(2))) {
      notifyWarning(`Le paiement dépasse le reste à payer (${formatAmount(due)}).`);
      return;
    }

    setPaying(true);
    await onSubmit({ dateIso: date, amount: val });
    setPaying(false);
  };

  return (
    <Modal opened onClose={onClose} title={`Enregistrer un paiement pour ${employeeName}`} size="md">
      <form onSubmit={submit}>
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="sm">Salaire total :</Text>
            <Text fw={700}>{formatAmount(salary.amount)}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Reste à payer :</Text>
            <Text fw={700} c="orange">{formatAmount(due)}</Text>
          </Group>

          <TextInput
            label="Date de paiement"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.currentTarget.value)}
          />

          <TextInput
            label="Montant du paiement (€)"
            type="number"
            step="0.01"
            required
            placeholder="Saisissez le montant..."
            value={amount}
            onChange={(e) => setAmount(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" color="green" loading={paying}>
              Confirmer le paiement
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
