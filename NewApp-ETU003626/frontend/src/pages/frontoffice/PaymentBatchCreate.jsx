import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
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
import { listSalaries, listPayments, addPayment } from '../../services/salaryService';
import { filterEmployees, uniqueJobs } from '../../utils/employeeFilters';
import { buildPaymentPlan } from '../../utils/paymentPlan';
import { formatAmount, formatDate } from '../../utils/format';
import { todayIso } from '../../utils/dates';
import { notifySuccess, notifyWarning } from '../../utils/notify';
import { useAsyncLoad } from '../../hooks/useAsyncLoad';
import { LoadingScreen, PageError } from '../../components/PageStates';
import EmployeeFilterCard from '../../components/EmployeeFilterCard';

const NO_FILTERS = { job: 'all', gender: 'all', hoursMin: '', hoursMax: '' };

// Listes déroulantes mois/année remplacées par un input type="month".
// const MONTH_OPTIONS = [
//   { value: '1', label: 'Janvier' },
//   { value: '2', label: 'Février' },
//   { value: '3', label: 'Mars' },
//   { value: '4', label: 'Avril' },
//   { value: '5', label: 'Mai' },
//   { value: '6', label: 'Juin' },
//   { value: '7', label: 'Juillet' },
//   { value: '8', label: 'Août' },
//   { value: '9', label: 'Septembre' },
//   { value: '10', label: 'Octobre' },
//   { value: '11', label: 'Novembre' },
//   { value: '12', label: 'Décembre' },
// ];
//
// // Années proposées : autour de l'année courante.
// const CURRENT_YEAR = new Date().getFullYear();
// const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => String(y));

// Couleur du badge selon le statut prévu/obtenu d'un paiement.
const STATUS_COLORS = { total: 'green', partiel: 'orange', 'non payé': 'gray' };

/**
 * Page "Générer paiements" : paie les salaires d'un mois donné en respectant
 * un budget et un ordre de priorité strict (poste prioritaire d'abord, puis
 * date de début croissante). Toute la logique est dans utils/paymentPlan.js.
 */
export default function PaymentBatchCreate() {
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filters, setFilters] = useState(NO_FILTERS);

  // Paramètres de paiement
  // `period` vient de l'input type="month" au format "aaaa-mm" (ex. "2026-02").
  const [period, setPeriod] = useState('');
  const [priorityJob, setPriorityJob] = useState('');
  const [budget, setBudget] = useState('');
  const [generating, setGenerating] = useState(false);

  // Rapport de génération (null = modale fermée)
  const [report, setReport] = useState(null);

  const { loading, error, reload } = useAsyncLoad(async () => {
    const [empData, salData, payData] = await Promise.all([
      listRealEmployees(),
      listSalaries(),
      listPayments(),
    ]);
    setEmployees(empData);
    setSalaries(salData);
    setPayments(payData);
  }, 'Impossible de charger les données nécessaires.');

  const selected = filterEmployees(employees, filters);
  const jobs = uniqueJobs(employees);
  const budgetValue = parseFloat(budget) || 0;

  // "2026-02" -> année 2026, mois 2.
  const [periodYear, periodMonth] = period ? period.split('-').map(Number) : [0, 0];

  // Plan de paiement calculé en direct : le tableau d'aperçu montre exactement
  // ce que fera le bouton "Générer paiement".
  const plan = period
    ? buildPaymentPlan({
        salaries,
        payments,
        employees: selected,
        month: periodMonth,
        year: periodYear,
        priorityJob,
        budget: budgetValue,
      })
    : [];

  const payableCount = plan.filter((row) => row.toPay > 0).length;

  // Exécute le plan : un paiement Dolibarr par ligne payable, dans l'ordre.
  const generatePayments = async () => {
    const result = { lines: [], errors: [], spent: 0 };

    for (const row of plan) {
      if (row.toPay <= 0) {
        result.lines.push({ row, outcome: 'non payé' });
        continue;
      }
      try {
        await addPayment(row.salary.id, { dateIso: todayIso(), amount: row.toPay });
        result.spent += row.toPay;
        result.lines.push({ row, outcome: row.status }); // 'total' ou 'partiel'
      } catch (err) {
        console.error(`Échec du paiement pour ${row.employee.lastname}:`, err);
        result.errors.push({
          name: row.employee.lastname,
          message: err.message || 'Erreur inconnue',
        });
      }
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!period || !priorityJob) {
      notifyWarning('Veuillez choisir le mois et le poste prioritaire.');
      return;
    }
    if (budgetValue <= 0) {
      notifyWarning('Le budget doit être supérieur à 0.');
      return;
    }
    if (plan.length === 0) {
      notifyWarning('Aucun salaire à payer pour ce mois (ou tout est déjà payé).');
      return;
    }

    setGenerating(true);
    const result = await generatePayments();
    setGenerating(false);

    setReport(result);
    if (result.errors.length === 0) {
      notifySuccess('Paiements générés.');
    }
    setBudget(''); // le reliquat éventuel est ignoré, jamais conservé
    await reload();
  };

  if (loading) return <LoadingScreen />;
  if (error) return <PageError title="Générer paiements">{error}</PageError>;

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">Générer paiements</Title>
        <Text c="dimmed">
          Payez les salaires d'un mois avec un budget donné : le poste prioritaire est réglé
          en premier, puis les autres, par date de début croissante
        </Text>
      </div>

      <Grid>
        {/* Colonne de gauche : filtres et aperçu de l'ordre de paiement */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            <EmployeeFilterCard employees={employees} filters={filters} onChange={setFilters} />

            <Card withBorder padding="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Title order={4}>Ordre de paiement ({plan.length} salaire(s))</Title>
                <Badge size="lg" color={payableCount > 0 ? 'blue' : 'gray'}>
                  {payableCount} payable(s) avec ce budget
                </Badge>
              </Group>

              {!period ? (
                <Alert color="blue" title="Choisissez un mois">
                  Sélectionnez le mois et l'année pour voir les salaires restant à payer.
                </Alert>
              ) : plan.length === 0 ? (
                <Alert color="orange" title="Rien à payer">
                  Aucun salaire avec un reste à payer pour cette période
                  (ou aucun salarié ne passe les filtres).
                </Alert>
              ) : (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      <Table.Th>Salarié</Table.Th>
                      <Table.Th>Poste</Table.Th>
                      <Table.Th>Début salaire</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Reste à payer</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>À payer</Table.Th>
                      <Table.Th>Statut prévu</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {plan.map((row, index) => (
                      <Table.Tr key={row.salary.id}>
                        <Table.Td c="dimmed">{index + 1}</Table.Td>
                        <Table.Td fw={600}>{row.employee.lastname}</Table.Td>
                        <Table.Td>
                          <Badge
                            variant="light"
                            color={(row.employee.job || '') === priorityJob ? 'blue' : 'gray'}
                          >
                            {row.employee.job || 'Non spécifié'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{formatDate(row.startDate)}</Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{formatAmount(row.due)}</Table.Td>
                        <Table.Td style={{ textAlign: 'right' }} fw={600}>
                          {formatAmount(row.toPay)}
                        </Table.Td>
                        <Table.Td>
                          <Badge color={STATUS_COLORS[row.status]}>{row.status}</Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Card>
          </Stack>
        </Grid.Col>

        {/* Colonne de droite : paramètres du paiement */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={4} mb="md">Paramètres de paiement</Title>
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                {/* Listes déroulantes remplacées par l'input type="month" ci-dessous.
                <Select
                  label="Mois"
                  placeholder="Choisir un mois"
                  required
                  data={MONTH_OPTIONS}
                  value={month}
                  onChange={(val) => setMonth(val || '')}
                />

                <Select
                  label="Année"
                  required
                  data={YEAR_OPTIONS}
                  value={year}
                  onChange={(val) => setYear(val || '')}
                />
                */}

                <TextInput
                  label="Mois"
                  type="month"
                  required
                  value={period}
                  onChange={(e) => setPeriod(e.currentTarget.value)}
                />

                <Select
                  label="Poste prioritaire"
                  placeholder="Choisir un poste"
                  required
                  data={jobs.map((j) => ({ value: j, label: j }))}
                  value={priorityJob}
                  onChange={(val) => setPriorityJob(val || '')}
                />

                <TextInput
                  label="Budget disponible (€)"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 2500.00"
                  required
                  value={budget}
                  onChange={(e) => setBudget(e.currentTarget.value)}
                />

                <Divider my="sm" />

                <Button
                  type="submit"
                  color="blue"
                  size="md"
                  fullWidth
                  loading={generating}
                  disabled={plan.length === 0 || budgetValue <= 0}
                >
                  Générer paiement
                </Button>
              </Stack>
            </form>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Rapport après génération (démontée à la fermeture) */}
      {report && <PaymentReportModal report={report} onClose={() => setReport(null)} />}
    </Stack>
  );
}

/** Compte rendu de la génération : ce qui a été payé, partiellement ou pas. */
function PaymentReportModal({ report, onClose }) {
  const paid = report.lines.filter((l) => l.outcome === 'total').length;
  const partial = report.lines.filter((l) => l.outcome === 'partiel').length;
  const unpaid = report.lines.filter((l) => l.outcome === 'non payé').length;

  return (
    <Modal opened onClose={onClose} title="Rapport de génération des paiements" size="md">
      <Stack gap="md">
        <Alert
          color={report.errors.length > 0 ? 'red' : unpaid + partial > 0 ? 'orange' : 'green'}
          title="Génération terminée"
        >
          <Text size="sm">Budget utilisé : <strong>{formatAmount(report.spent)}</strong></Text>
          <Text size="sm">
            Payés intégralement : <strong>{paid}</strong> · Partiels : <strong>{partial}</strong> ·
            Non payés (budget épuisé) : <strong>{unpaid}</strong>
          </Text>
        </Alert>

        <Table striped size="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Salarié</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Montant payé</Table.Th>
              <Table.Th>Statut</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {report.lines.map((line) => (
              <Table.Tr key={line.row.salary.id}>
                <Table.Td fw={500}>{line.row.employee.lastname}</Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>{formatAmount(line.row.toPay)}</Table.Td>
                <Table.Td>
                  <Badge color={STATUS_COLORS[line.outcome]}>{line.outcome}</Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {report.errors.length > 0 && (
          <Alert color="red" title="Erreurs Dolibarr">
            {report.errors.map((e, i) => (
              <Text size="xs" key={i}>{e.name} : {e.message}</Text>
            ))}
          </Alert>
        )}

        <Group justify="flex-end">
          <Button onClick={onClose}>Fermer</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
