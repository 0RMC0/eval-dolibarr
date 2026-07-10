import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Grid,
  Group,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { listRealEmployees } from '../../services/employeeService';
import { createPeriodSalary, listSalaries } from '../../services/salaryService';
import { listHolidays } from '../../services/holidayService';
import { filterEmployees } from '../../utils/employeeFilters';
import { monthlySalaryPlan } from '../../utils/salaryCalcWeekend';
import { dayIso } from '../../utils/salaryCalc';
import { formatAmount } from '../../utils/format';
import { notifySuccess, notifyWarning } from '../../utils/notify';
import { useAsyncLoad } from '../../hooks/useAsyncLoad';
import { LoadingScreen, PageError } from '../../components/PageStates';
import EmployeeFilterCard from '../../components/EmployeeFilterCard';
import GenerationReportModal from '../../components/GenerationReportModal';

// Valeurs de départ des filtres (= aucun filtre actif).
const NO_FILTERS = { job: 'all', gender: 'all', hoursMin: '', hoursMax: '' };

/**
 * [J2] Copie de la génération au tarif journalier, avec MAJORATION WEEK-END.
 * Cases Samedi / Dimanche : si cochée, le jour correspondant est majoré x3
 * (et x6 s'il est aussi férié). Non coché = jour normal.
 * Toute la règle de calcul est dans utils/salaryCalcWeekend.js.
 */
export default function SalaryPerDayWeekendBatchCreate() {
  const [employees, setEmployees] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [filters, setFilters] = useState(NO_FILTERS);

  // Formulaire de génération
  const [month, setMonth] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [weekend, setWeekend] = useState({ saturday: false, sunday: false });
  const [generating, setGenerating] = useState(false);

  // Rapport de génération
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState(null);

  const { loading, error, reload } = useAsyncLoad(async () => {
    const [empData, holidayData, salData] = await Promise.all([
      listRealEmployees(),
      listHolidays(),
      listSalaries(),
    ]);
    setEmployees(empData);
    setHolidays(holidayData);
    setSalaries(salData);
  }, 'Impossible de charger les données nécessaires.');

  const selected = filterEmployees(employees, filters);
  const rate = parseFloat(dailyRate) || 0;

  // Plan de paie du mois pour un employé — utilisé par l'aperçu ET la génération.
  const planFor = (empId) =>
    monthlySalaryPlan({ salaries, holidays, empId, month, dailyRate: rate, weekend });

  // Suffixe de libellé qui rappelle les majorations appliquées.
  const weekendLabel = () => {
    const jours = [];
    if (weekend.saturday) jours.push('samedi');
    if (weekend.sunday) jours.push('dimanche');
    return jours.length > 0 ? `, ${jours.join('/')} majoré(s) x3` : '';
  };

  // Crée un salaire par plage non payée, pour chaque salarié sélectionné.
  const generateSalaries = async () => {
    const result = { success: 0, failed: [] };

    for (const emp of selected) {
      const plan = planFor(emp.id);

      // Tout le mois est déjà couvert : rien à générer pour cet employé.
      if (plan.intervals.length === 0) {
        result.failed.push({
          name: emp.lastname,
          error: 'Le mois entier est déjà couvert par des salaires existants.',
        });
        continue;
      }

      let allOk = true;
      for (const interval of plan.intervals) {
        const { year, monthStr } = plan.monthInfo;
        try {
          await createPeriodSalary({
            userId: emp.id,
            startIso: dayIso(year, monthStr, interval.startDay),
            endIso: dayIso(year, monthStr, interval.endDay),
            amount: interval.amount,
            labelSuffix: ` (${interval.totalDays} jours, dont ${interval.holidayDays} férié(s) x2${weekendLabel()})`,
          });
        } catch (err) {
          console.error(`Échec de génération pour ${emp.lastname}:`, err);
          result.failed.push({
            name: `${emp.lastname} (Période: ${interval.startDay} au ${interval.endDay})`,
            error: err.message || 'Erreur inconnue',
          });
          allOk = false;
        }
      }
      if (allOk) result.success++;
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selected.length === 0) {
      notifyWarning('Aucun salarié sélectionné.');
      return;
    }
    if (!month || !dailyRate) {
      notifyWarning('Veuillez remplir tous les champs.');
      return;
    }
    if (rate <= 0) {
      notifyWarning('Le tarif journalier doit être supérieur à 0.');
      return;
    }

    setGenerating(true);
    const result = await generateSalaries();
    setGenerating(false);

    setReport(result);
    setReportOpen(true);

    if (result.success > 0) {
      notifySuccess('Génération effectuée.');
      setMonth('');
      setDailyRate('');
      await reload(); // Recharge les salaires pour refléter les créations
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <PageError title="Générer des salaires (tarif journalier + week-end)">{error}</PageError>;

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">Générer des salaires (tarif journalier + week-end)</Title>
        <Text c="dimmed">
          Comme la génération au tarif journalier, avec une majoration x3 sur les
          samedis et/ou dimanches cochés (x6 si le jour est aussi férié)
        </Text>
      </div>

      <Grid>
        {/* Colonne de gauche : filtres et aperçu */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            <EmployeeFilterCard employees={employees} filters={filters} onChange={setFilters} />

            {/* Aperçu avec estimation (tableau propre à cette page) */}
            <Card withBorder padding="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Title order={4}>Salariés sélectionnés ({selected.length})</Title>
                <Badge size="lg" color={selected.length > 0 ? 'blue' : 'gray'}>
                  {selected.length} / {employees.length} au total
                </Badge>
              </Group>

              {selected.length === 0 ? (
                <Alert color="orange" title="Aucune cible">
                  Aucun salarié ne correspond aux critères de filtres actuels.
                </Alert>
              ) : (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Nom</Table.Th>
                      <Table.Th>Identifiant</Table.Th>
                      <Table.Th>Poste</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Heures hebdo</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Détails jours à payer</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Salaire brut estimé</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selected.map((emp) => {
                      const plan = planFor(emp.id);
                      const hasDaysToPay = plan.intervals.length > 0;
                      return (
                        <Table.Tr key={emp.id}>
                          <Table.Td fw={600}>{emp.lastname}</Table.Td>
                          <Table.Td c="dimmed">@{emp.login}</Table.Td>
                          <Table.Td>
                            <Badge variant="light" color="gray">
                              {emp.job || 'Non spécifié'}
                            </Badge>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>
                            {emp.weeklyhours ? `${parseFloat(emp.weeklyhours)}h` : '-'}
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>
                            {!month ? (
                              '-'
                            ) : hasDaysToPay ? (
                              <Text size="xs">
                                {plan.normalDays} normaux + {plan.holidayDays} férié (x2)
                                {plan.weekendDays > 0 && ` + ${plan.weekendDays} week-end (x3)`}
                              </Text>
                            ) : (
                              <Badge color="gray">Déjà payé</Badge>
                            )}
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>
                            {month && rate > 0 ? (
                              <Text size="sm" fw={600}>{formatAmount(plan.totalAmount)}</Text>
                            ) : (
                              '-'
                            )}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              )}
            </Card>
          </Stack>
        </Grid.Col>

        {/* Colonne de droite : paramètres de génération */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={4} mb="md">Paramètres de paie</Title>
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label="Mois"
                  type="month"
                  required
                  value={month}
                  onChange={(e) => setMonth(e.currentTarget.value)}
                />

                <TextInput
                  label="Tarif journalier brut (€)"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 80.00"
                  required
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.currentTarget.value)}
                />

                {/* Cases de majoration week-end */}
                <Checkbox
                  label="Majorer les samedis (x3)"
                  checked={weekend.saturday}
                  onChange={(e) => setWeekend({ ...weekend, saturday: e.currentTarget.checked })}
                />
                <Checkbox
                  label="Majorer les dimanches (x3)"
                  checked={weekend.sunday}
                  onChange={(e) => setWeekend({ ...weekend, sunday: e.currentTarget.checked })}
                />

                <Divider my="sm" />

                <Button
                  type="submit"
                  color="blue"
                  size="md"
                  fullWidth
                  loading={generating}
                  disabled={selected.length === 0 || !month || rate <= 0}
                >
                  Générer pour {selected.length} salarié(s)
                </Button>
              </Stack>
            </form>
          </Card>
        </Grid.Col>
      </Grid>

      <GenerationReportModal
        opened={reportOpen}
        onClose={() => setReportOpen(false)}
        report={report}
        successLabel="Salariés traités avec succès"
        failedLabel="Échecs de création / Non requis"
      />
    </Stack>
  );
}
