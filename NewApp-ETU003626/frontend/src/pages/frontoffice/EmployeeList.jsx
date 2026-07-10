import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Center,
  Grid,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { listRealEmployees } from '../../services/employeeService';
import { filterEmployees, uniqueJobs } from '../../utils/employeeFilters';
import { useAsyncLoad } from '../../hooks/useAsyncLoad';
import { LoadingScreen, PageError } from '../../components/PageStates';
import EmployeeAvatar from '../../components/EmployeeAvatar';

// [J1 - 2.a] Liste des salariés avec recherche multi-critères.
export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('all');
  const [job, setJob] = useState('all');

  const { loading, error } = useAsyncLoad(async () => {
    setEmployees(await listRealEmployees());
  }, 'Impossible de charger la liste des salariés depuis Dolibarr.');

  const jobs = uniqueJobs(employees);
  const filtered = filterEmployees(employees, { search, gender, job });

  if (loading) return <LoadingScreen />;
  if (error) return <PageError title="Salariés">{error}</PageError>;

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
              value={gender}
              onChange={(val) => setGender(val || 'all')}
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
              value={job}
              onChange={(val) => setJob(val || 'all')}
              data={[
                { value: 'all', label: 'Tous les postes' },
                ...jobs.map((j) => ({ value: j, label: j })),
              ]}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Grille des salariés */}
      {filtered.length === 0 ? (
        <Center style={{ height: '30vh' }}>
          <Text c="dimmed">Aucun salarié ne correspond aux critères.</Text>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {filtered.map((emp) => (
            <EmployeeCard key={emp.id} employee={emp} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}

/** Carte d'un salarié : photo, infos et accès direct à la paie. */
function EmployeeCard({ employee }) {
  const navigate = useNavigate();

  return (
    <Card withBorder padding="lg" radius="md" shadow="sm">
      <Stack align="center" gap="sm">
        <EmployeeAvatar
          userId={employee.id}
          photo={employee.photo}
          name={employee.lastname}
          size={80}
        />

        <Stack align="center" gap={2}>
          <Text fw={700} size="lg">{employee.lastname}</Text>
          <Text size="xs" c="dimmed">@{employee.login}</Text>
        </Stack>

        <Group gap={6}>
          <Badge color={employee.gender === 'woman' ? 'pink' : 'blue'} variant="light">
            {employee.gender === 'woman' ? 'Femme' : 'Homme'}
          </Badge>
          <Badge color="gray" variant="light">
            {employee.job || 'Poste non défini'}
          </Badge>
        </Group>

        <Stack gap={2} align="center" w="100%" mt="md">
          <Text size="xs" c="dimmed">Temps de travail</Text>
          <Text fw={600} size="sm">
            {employee.weeklyhours
              ? `${parseFloat(employee.weeklyhours)}h / semaine`
              : 'Non spécifié'}
          </Text>
        </Stack>

        <Button
          fullWidth
          variant="light"
          color="blue"
          mt="md"
          onClick={() => navigate(`/salaires/nouveau?employeeId=${employee.id}`)}
        >
          Créer / payer un salaire
        </Button>
      </Stack>
    </Card>
  );
}
