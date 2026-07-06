import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Title,
  Text,
  TextInput,
  Select,
  Grid,
  Card,
  Badge,
  Button,
  Group,
  Stack,
  Center,
  Loader,
  Alert,
  SimpleGrid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { listEmployees } from '../../services/employeeService';
import EmployeeAvatar from '../../components/EmployeeAvatar';

export default function EmployeeList() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        setError(null);
        const data = await listEmployees();
        // Filtrer pour ne garder que les salariés réels (qui ont une référence salarié)
        const realEmployees = data.filter((u) => u.ref_employee && u.employee === '1');
        setEmployees(realEmployees);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger la liste des salariés depuis Dolibarr.');
        notifications.show({
          color: 'red',
          title: 'Erreur',
          message: err.message || 'Une erreur est survenue lors de la communication avec l\'API.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  // Dynamically collect jobs for the filter dropdown
  const jobs = Array.from(
    new Set(employees.map((e) => e.job).filter(Boolean))
  ).sort();

  // Apply filters client-side
  const filteredEmployees = employees.filter((emp) => {
    const name = emp.lastname || '';
    const login = emp.login || '';
    const job = emp.job || '';
    
    // 1. Text search
    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      login.toLowerCase().includes(search.toLowerCase()) ||
      job.toLowerCase().includes(search.toLowerCase());

    // 2. Gender filter
    const matchesGender =
      genderFilter === 'all' ||
      (genderFilter === 'man' && emp.gender === 'man') ||
      (genderFilter === 'woman' && emp.gender === 'woman');

    // 3. Job filter
    const matchesJob =
      jobFilter === 'all' || emp.job === jobFilter;

    return matchesSearch && matchesGender && matchesJob;
  });

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
        <Title order={2}>Salariés</Title>
        <Alert color="red" title="Erreur">
          {error}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">Liste des salariés</Title>
        <Text c="dimmed">
          Consultez et recherchez les salariés configurés dans l'ERP Dolibarr
        </Text>
      </div>

      {/* Barre de recherche et filtres */}
      <Card withBorder padding="md" radius="md">
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <TextInput
              label="Recherche"
              placeholder="Rechercher par nom, identifiant, poste..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
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

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
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
        </Grid>
      </Card>

      {/* Grille des salariés */}
      {filteredEmployees.length === 0 ? (
        <Center style={{ height: '30vh' }}>
          <Text c="dimmed">Aucun salarié ne correspond aux critères.</Text>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {filteredEmployees.map((emp) => (
            <Card
              key={emp.id}
              withBorder
              padding="lg"
              radius="md"
              shadow="sm"
              style={{
                transition: 'transform 150ms ease, box-shadow 150ms ease',
                cursor: 'default',
              }}
            >
              <Stack align="center" gap="sm">
                <EmployeeAvatar
                  userId={emp.id}
                  photo={emp.photo}
                  name={emp.lastname}
                  size={80}
                />

                <Stack align="center" gap={2}>
                  <Text fw={700} size="lg">
                    {emp.lastname}
                  </Text>
                  <Text size="xs" c="dimmed">
                    @{emp.login}
                  </Text>
                </Stack>

                <Group gap={6}>
                  <Badge color={emp.gender === 'woman' ? 'pink' : 'blue'} variant="light">
                    {emp.gender === 'woman' ? 'Femme' : 'Homme'}
                  </Badge>
                  <Badge color="gray" variant="light">
                    {emp.job || 'Poste non défini'}
                  </Badge>
                </Group>

                <Group justify="center" gap="xs" mt="md" w="100%">
                  <Stack gap={2} align="center" w="100%">
                    <Text size="xs" c="dimmed">
                      Temps de travail
                    </Text>
                    <Text fw={600} size="sm">
                      {emp.weeklyhours ? `${parseFloat(emp.weeklyhours)}h / semaine` : 'Non spécifié'}
                    </Text>
                  </Stack>
                </Group>

                <Button
                  fullWidth
                  variant="light"
                  color="blue"
                  mt="md"
                  onClick={() => navigate(`/salaires/nouveau?employeeId=${emp.id}`)}
                >
                  Créer / payer un salaire
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
