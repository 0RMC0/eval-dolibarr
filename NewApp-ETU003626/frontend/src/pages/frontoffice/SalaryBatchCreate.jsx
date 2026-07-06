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
import { createSalary } from '../../services/salaryService';
import { formatAmount } from '../../utils/format';

export default function SalaryBatchCreate() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [jobFilter, setJobFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [hoursMin, setHoursMin] = useState('');
  const [hoursMax, setHoursMax] = useState('');

  // Generation Form State
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [amount, setAmount] = useState('');
  const [generating, setGenerating] = useState(false);

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [generationReport, setGenerationReport] = useState(null);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        setError(null);
        const data = await listEmployees();
        const realEmployees = data.filter((u) => u.ref_employee && u.employee === '1');
        setEmployees(realEmployees);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les salariés.');
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  // Collect unique jobs dynamically for the Select filter
  const jobs = Array.from(new Set(employees.map((e) => e.job).filter(Boolean))).sort();

  // Apply filters to get target employees
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

  const handleBatchGenerate = async (e) => {
    e.preventDefault();
    if (filteredEmployees.length === 0) {
      notifications.show({ color: 'orange', message: 'Aucun salarié sélectionné.' });
      return;
    }
    if (!dateDebut || !dateFin || !amount) {
      notifications.show({ color: 'orange', message: 'Veuillez remplir tous les champs de génération.' });
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      notifications.show({ color: 'orange', message: 'Le montant doit être supérieur à 0.' });
      return;
    }

    setGenerating(true);
    const report = {
      success: 0,
      failed: [],
    };

    const formatDateFR = (dateStr) => {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    for (const emp of filteredEmployees) {
      try {
        const payload = {
          fk_user: Number(emp.id),
          label: `Salaire du ${formatDateFR(dateDebut)} au ${formatDateFR(dateFin)}`,
          amount: val,
          datesp: dateDebut,
          dateep: dateFin,
        };
        await createSalary(payload);
        report.success++;
      } catch (err) {
        console.error(`Failed to generate salary for ${emp.lastname}:`, err);
        report.failed.push({
          name: emp.lastname,
          error: err.message || 'Erreur inconnue',
        });
      }
    }

    setGenerating(false);
    setGenerationReport(report);
    setReportModalOpen(true);

    if (report.success > 0) {
      notifications.show({
        color: 'green',
        message: `${report.success} salaire(s) généré(s) avec succès.`,
      });
      // Clear inputs
      setDateDebut('');
      setDateFin('');
      setAmount('');
    }
  };

  if (loading) {
    return (
      <Center style={{ height: '70vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Stack p="md">
        <Title order={2}>Générer des salaires</Title>
        <Alert color="red" title="Erreur">
          {error}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">Générer des salaires (par lot)</Title>
        <Text c="dimmed">
          Sélectionnez des salariés à l'aide des filtres pour leur attribuer un salaire en une seule opération
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
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredEmployees.map((emp) => (
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
                      </Table.Tr>
                    ))}
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
                  label="Montant brut à générer (€)"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1500.00"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.currentTarget.value)}
                />

                <Divider my="sm" />

                <Button
                  type="submit"
                  color="blue"
                  size="md"
                  fullWidth
                  loading={generating}
                  disabled={filteredEmployees.length === 0}
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
                Salaires créés avec succès : <strong>{generationReport.success}</strong>
              </Text>
              {generationReport.failed.length > 0 && (
                <Text size="sm" mt="xs">
                  Échecs de création : <strong>{generationReport.failed.length}</strong>
                </Text>
              )}
            </Alert>

            {generationReport.failed.length > 0 && (
              <Stack gap="xs">
                <Text fw={600} size="sm">
                  Détail des erreurs :
                </Text>
                <Table striped withBorder size="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Salarié</Table.Th>
                      <Table.Th>Message d'erreur</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {generationReport.failed.map((f, i) => (
                      <Table.Tr key={i}>
                        <Table.Td fw={500}>{f.name}</Table.Td>
                        <Table.Td c="red">{f.error}</Table.Td>
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
