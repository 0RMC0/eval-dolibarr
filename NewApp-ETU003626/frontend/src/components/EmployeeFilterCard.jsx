import { Card, Grid, Select, TextInput, Title } from '@mantine/core';
import { uniqueJobs } from '../utils/employeeFilters';

const GENDER_OPTIONS = [
  { value: 'all', label: 'Tous les genres' },
  { value: 'man', label: 'Homme' },
  { value: 'woman', label: 'Femme' },
];

/**
 * Carte de filtres poste / genre / heures pour cibler des salariés.
 * `filters` = { job, gender, hoursMin, hoursMax } ; `onChange(nouveauxFiltres)`.
 */
export default function EmployeeFilterCard({ employees, filters, onChange }) {
  const jobs = uniqueJobs(employees);
  const set = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <Card withBorder padding="lg" radius="md">
      <Title order={4} mb="md">Filtrer les salariés</Title>
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Select
            label="Poste"
            value={filters.job}
            onChange={(val) => set('job', val || 'all')}
            data={[
              { value: 'all', label: 'Tous les postes' },
              ...jobs.map((j) => ({ value: j, label: j })),
            ]}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Select
            label="Genre"
            value={filters.gender}
            onChange={(val) => set('gender', val || 'all')}
            data={GENDER_OPTIONS}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            label="Heures de travail min"
            type="number"
            placeholder="Ex: 30"
            value={filters.hoursMin}
            onChange={(e) => set('hoursMin', e.currentTarget.value)}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            label="Heures de travail max"
            type="number"
            placeholder="Ex: 35"
            value={filters.hoursMax}
            onChange={(e) => set('hoursMax', e.currentTarget.value)}
          />
        </Grid.Col>
      </Grid>
    </Card>
  );
}
