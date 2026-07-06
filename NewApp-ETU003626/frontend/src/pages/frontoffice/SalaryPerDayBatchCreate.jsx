import { useEffect, useState } from 'react';
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
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { listEmployees } from '../../services/employeeService';
import { createSalary, listSalaries } from '../../services/salaryService';
import { listHolidays } from '../../services/holidayService';
import { formatAmount } from '../../utils/format';

export default function SalaryPerDayBatchCreate() {
  const [employees, setEmployees] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [jobFilter, setJobFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [hoursMin, setHoursMin] = useState('');
  const [hoursMax, setHoursMax] = useState('');

  // Generation Form State
  const [month, setMonth] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [generating, setGenerating] = useState(false);

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [generationReport, setGenerationReport] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [empData, holidayData, salData] = await Promise.all([
        listEmployees(),
        listHolidays(),
        listSalaries(),
      ]);
      const realEmployees = empData.filter((u) => u.ref_employee && u.employee === '1');
      setEmployees(realEmployees);
      setHolidays(holidayData);
      setSalaries(salData);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les données nécessaires.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Collect unique jobs dynamically
  const jobs = Array.from(new Set(employees.map((e) => e.job).filter(Boolean))).sort();

  // Apply filters
  const filteredEmployees = employees.filter((emp) => {
    const matchesJob = jobFilter === 'all' || emp.job === jobFilter;
    const matchesGender =
      genderFilter === 'all' ||
      (genderFilter === 'man' && emp.gender === 'man') ||
      (genderFilter === 'woman' && emp.gender === 'woman');

    const hours = parseFloat(emp.weeklyhours) || 0;
    const minVal = parseFloat(hoursMin);
    const maxVal = parseFloat(hoursMax);

    const matchesMin = isNaN(minVal) || hours >= minVal;
    const matchesMax = isNaN(maxVal) || hours <= maxVal;

    return matchesJob && matchesGender && matchesMin && matchesMax;
  });

  // Helper to parse date strings or timestamps
  const toDate = (val) => {
    if (!val) return null;
    if (typeof val === 'number') return new Date(val * 1000);
    return new Date(val);
  };

  // Interval subtraction: finds unpaid calendar day ranges within the month
  const getUnpaidIntervalsForEmployee = (empId) => {
    if (!month) return [];
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const dayPaid = new Array(daysInMonth + 1).fill(false);

    const empSalaries = salaries.filter((s) => String(s.fk_user) === String(empId));

    for (const sal of empSalaries) {
      const start = toDate(sal.datesp);
      const end = toDate(sal.dateep);
      if (!start || !end) continue;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthIndex, day);
        const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const compareStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const compareEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

        if (compareDate >= compareStart && compareDate <= compareEnd) {
          dayPaid[day] = true;
        }
      }
    }

    const intervals = [];
    let inInterval = false;
    let startDay = null;

    for (let day = 1; day <= daysInMonth; day++) {
      const isPaid = dayPaid[day];
      if (!isPaid) {
        if (!inInterval) {
          inInterval = true;
          startDay = day;
        }
      } else {
        if (inInterval) {
          intervals.push({ startDay, endDay: day - 1 });
          inInterval = false;
        }
      }
    }
    if (inInterval) {
      intervals.push({ startDay, endDay: daysInMonth });
    }

    return intervals;
  };

  // Calculates breakdown and salary for a single employee based on unpaid intervals
  const getEmployeeSalaryCalculation = (empId) => {
    const rateVal = parseFloat(dailyRate) || 0;
    if (!month) return { normalDays: 0, holidaysCount: 0, totalAmount: 0, intervals: [] };

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);

    const intervals = getUnpaidIntervalsForEmployee(empId);
    let normalDays = 0;
    let holidaysCount = 0;
    let totalAmount = 0;

    for (const interval of intervals) {
      const { startDay, endDay } = interval;
      let intervalHolidays = 0;

      for (let d = startDay; d <= endDay; d++) {
        const dateStr = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
        const isHoliday = holidays.some((h) => h.date === dateStr);
        if (isHoliday) {
          intervalHolidays++;
        }
      }

      const intervalTotalDays = endDay - startDay + 1;
      const intervalNormalDays = intervalTotalDays - intervalHolidays;

      normalDays += intervalNormalDays;
      holidaysCount += intervalHolidays;
      totalAmount += (intervalNormalDays * rateVal) + (intervalHolidays * 2 * rateVal);
    }

    return {
      normalDays,
      holidaysCount,
      totalAmount,
      intervals,
    };
  };

  const handleBatchGenerate = async (e) => {
    e.preventDefault();
    if (filteredEmployees.length === 0) {
      notifications.show({ color: 'orange', message: 'Aucun salarié sélectionné.' });
      return;
    }
    if (!month || !dailyRate) {
      notifications.show({ color: 'orange', message: 'Veuillez remplir tous les champs.' });
      return;
    }

    const rateVal = parseFloat(dailyRate) || 0;
    if (isNaN(rateVal) || rateVal <= 0) {
      notifications.show({ color: 'orange', message: 'Le tarif journalier doit être supérieur à 0.' });
      return;
    }

    setGenerating(true);
    const report = {
      success: 0,
      failed: [],
    };

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);

    const formatDateFR = (dateStr) => {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    };

    for (const emp of filteredEmployees) {
      const calc = getEmployeeSalaryCalculation(emp.id);
      if (calc.intervals.length === 0) {
        report.failed.push({
          name: emp.lastname,
          error: 'Le mois entier est déjà couvert par des salaires existants.',
        });
        continue;
      }

      let empSuccess = true;
      for (const interval of calc.intervals) {
        const { startDay, endDay } = interval;

        // Calculate specifics for this sub-period
        let intervalHolidays = 0;
        for (let d = startDay; d <= endDay; d++) {
          const dateStr = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
          const isHoliday = holidays.some((h) => h.date === dateStr);
          if (isHoliday) {
            intervalHolidays++;
          }
        }

        const intervalTotalDays = endDay - startDay + 1;
        const intervalNormalDays = intervalTotalDays - intervalHolidays;
        const intervalAmount = (intervalNormalDays * rateVal) + (intervalHolidays * 2 * rateVal);

        const dateDebutStr = `${year}-${monthStr}-${String(startDay).padStart(2, '0')}`;
        const dateFinStr = `${year}-${monthStr}-${String(endDay).padStart(2, '0')}`;

        try {
          const payload = {
            fk_user: Number(emp.id),
            label: `Salaire du ${formatDateFR(dateDebutStr)} au ${formatDateFR(dateFinStr)} (${intervalTotalDays} jours, dont ${intervalHolidays} férié(s) x2)`,
            amount: intervalAmount,
            datesp: dateDebutStr,
            dateep: dateFinStr,
          };
          await createSalary(payload);
        } catch (err) {
          console.error(`Failed to generate salary for ${emp.lastname}:`, err);
          report.failed.push({
            name: `${emp.lastname} (Période: ${startDay} au ${endDay})`,
            error: err.message || 'Erreur inconnue',
          });
          empSuccess = false;
        }
      }

      if (empSuccess) {
        report.success++;
      }
    }

    setGenerating(false);
    setGenerationReport(report);
    setReportModalOpen(true);

    if (report.success > 0) {
      notifications.show({
        color: 'green',
        message: `Génération effectuée.`,
      });
      setMonth('');
      setDailyRate('');
      await loadData(); // Reload salaries list to reflect new generations
    }
  };

  if (loading && employees.length === 0) {
    return (
      <Center style={{ height: '70vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Stack p="md">
        <Title order={2}>Générer des salaires (tarif journalier)</Title>
        <Alert color="red" title="Erreur">
          {error}
        </Alert>
      </Stack>
    );
  }

  const rateVal = parseFloat(dailyRate) || 0;

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">Générer des salaires (tarif journalier)</Title>
        <Text c="dimmed">
          Sélectionnez des salariés à l'aide des filtres pour leur attribuer un salaire basé sur le nombre de jours ouvrés restants du mois
        </Text>
      </div>

      <Grid>
        {/* Colonne de gauche : Filtres et Aperçu */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            {/* Filtres de sélection */}
            <Card withBorder padding="lg" radius="md">
              <Title order={4} mb="md">Filtrer les salariés</Title>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Poste"
                    value={jobFilter}
                    onChange={(val) => setJobFilter(val || 'all')}
                    data={[
                      { value: 'all', label: 'Tous les postes' },
                      ...jobs.map((j) => ({ value: j, label: j })),
                    ]}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Genre"
                    value={genderFilter}
                    onChange={(val) => setGenderFilter(val || 'all')}
                    data={[
                      { value: 'all', label: 'Tous les genres' },
                      { value: 'man', label: 'Homme' },
                      { value: 'woman', label: 'Femme' },
                    ]}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Heures de travail min"
                    type="number"
                    placeholder="Ex: 30"
                    value={hoursMin}
                    onChange={(e) => setHoursMin(e.currentTarget.value)}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Heures de travail max"
                    type="number"
                    placeholder="Ex: 35"
                    value={hoursMax}
                    onChange={(e) => setHoursMax(e.currentTarget.value)}
                  />
                </Grid.Col>
              </Grid>
            </Card>

            {/* Aperçu de la sélection */}
            <Card withBorder padding="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Title order={4}>Salariés sélectionnés ({filteredEmployees.length})</Title>
                <Badge size="lg" color={filteredEmployees.length > 0 ? 'blue' : 'gray'}>
                  {filteredEmployees.length} / {employees.length} au total
                </Badge>
              </Group>

              {filteredEmployees.length === 0 ? (
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
                    {filteredEmployees.map((emp) => {
                      const calc = getEmployeeSalaryCalculation(emp.id);
                      const hasDaysToPay = calc.intervals.length > 0;
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
                            {month ? (
                              hasDaysToPay ? (
                                <Text size="xs">
                                  {calc.normalDays} j normaux + {calc.holidaysCount} j ferie (x2)
                                  {/* <Text size="10px" c="dimmed">({calc.intervals.length} période(s))</Text> */}
                                </Text>
                              ) : (
                                <Badge color="gray">Déjà payé</Badge>
                              )
                            ) : (
                              '-'
                            )}
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {month && rateVal > 0 ? (
                              hasDaysToPay ? formatAmount(calc.totalAmount) : formatAmount(0)
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

        {/* Colonne de droite : Paramètres de génération */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={4} mb="md">Paramètres de paie</Title>
            <form onSubmit={handleBatchGenerate}>
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

                <Divider my="sm" />

                <Button
                  type="submit"
                  color="blue"
                  size="md"
                  fullWidth
                  loading={generating}
                  disabled={filteredEmployees.length === 0 || !month || rateVal <= 0}
                >
                  Générer pour {filteredEmployees.length} salarié(s)
                </Button>
              </Stack>
            </form>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Modal de compte rendu de la génération */}
      <Modal
        opened={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Rapport de génération des salaires"
        size="md"
      >
        {generationReport && (
          <Stack gap="md">
            <Alert
              color={generationReport.failed.length > 0 ? 'orange' : 'green'}
              title="Génération terminée"
            >
              <Text size="sm">
                Salariés traités avec succès : <strong>{generationReport.success}</strong>
              </Text>
              {generationReport.failed.length > 0 && (
                <Text size="sm" mt="xs">
                  Échecs de création / Non requis : <strong>{generationReport.failed.length}</strong>
                </Text>
              )}
            </Alert>

            {generationReport.failed.length > 0 && (
              <Stack gap="xs">
                <Text fw={600} size="sm">
                  Détails :
                </Text>
                <Table striped withBorder size="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Salarié</Table.Th>
                      <Table.Th>Raison / Erreur</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {generationReport.failed.map((f, i) => (
                      <Table.Tr key={i}>
                        <Table.Td fw={500}>{f.name}</Table.Td>
                        <Table.Td c={f.error.includes('Déjà payé') || f.error.includes('couvert') ? 'dimmed' : 'red'}>{f.error}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            )}

            <Group justify="flex-end" mt="md">
              <Button onClick={() => setReportModalOpen(false)}>Fermer</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
