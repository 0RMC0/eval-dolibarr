import { useState } from 'react';
import { Card, Center, Grid, Group, Stack, Table, Text, Title } from '@mantine/core';
import { DonutChart, BarChart } from '@mantine/charts';
import { getDashboardData } from '../../services/dashboardService';
import { formatAmount } from '../../utils/format';
import { useAsyncLoad } from '../../hooks/useAsyncLoad';
import { LoadingScreen, PageError } from '../../components/PageStates';

const chartValueFormatter = (value) => `${value.toLocaleString('fr-FR')} MGA`;

// [J1 - 1.d] Dashboard : masse salariale par genre et par mois.
export default function Dashboard() {
  const [genderData, setGenderData] = useState([]);
  const [monthData, setMonthData] = useState([]);

  const { loading, error } = useAsyncLoad(async () => {
    const { byGender, byMonth } = await getDashboardData();
    setGenderData(byGender);
    setMonthData(byMonth);
  }, 'Impossible de charger les données du tableau de bord depuis Dolibarr.');

  const total = genderData.reduce((acc, curr) => acc + curr.value, 0);

  if (loading) return <LoadingScreen />;
  if (error) return <PageError title="Tableau de bord">{error}</PageError>;

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">Tableau de bord</Title>
        <Text c="dimmed">
          Vue d'ensemble des salaires cumulés issus de l'ERP Dolibarr
        </Text>
      </div>

      {/* Indicateurs */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatCard label="Masse Salariale Totale" value={formatAmount(total)} />
        </Grid.Col>
        {genderData.map((g) => (
          <Grid.Col span={{ base: 12, md: 4 }} key={g.name}>
            <StatCard label={`Total ${g.name}s`} value={formatAmount(g.value)} color={g.color} />
          </Grid.Col>
        ))}
      </Grid>

      {/* Graphiques */}
      <Grid mt="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <GenderDonutCard data={genderData} total={total} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <MonthBarCard data={monthData} />
        </Grid.Col>
      </Grid>

      <MonthTableCard data={monthData} />
    </Stack>
  );
}

/** Carte indicateur simple : libellé + valeur. */
function StatCard({ label, value, color }) {
  return (
    <Card withBorder padding="lg" radius="md">
      <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
        {label}
      </Text>
      <Text size="xl" fw={700} mt="xs" c={color}>
        {value}
      </Text>
    </Card>
  );
}

function NoData({ height = '300px' }) {
  return (
    <Center style={{ height }}>
      <Text c="dimmed">Aucune donnée disponible</Text>
    </Center>
  );
}

/** [1.d.I] Donut de la masse salariale par genre + légende détaillée. */
function GenderDonutCard({ data, total }) {
  return (
    <Card withBorder padding="lg" radius="md" style={{ height: '420px' }}>
      <Title order={4} mb="lg">Masse salariale par genre</Title>
      {data.length === 0 ? (
        <NoData />
      ) : (
        <Center style={{ height: '300px' }}>
          <Stack align="center" gap="xs">
            <DonutChart
              data={data}
              size={180}
              thickness={25}
              withTooltip
              valueFormatter={chartValueFormatter}
            />
            <Group justify="center" gap="md" mt="sm">
              {data.map((item) => (
                <Group gap={6} key={item.name}>
                  <Text size="xs" fw={500} c={item.color}>
                    ● {item.name} : {((item.value / total) * 100).toFixed(1)}% ({formatAmount(item.value)})
                  </Text>
                </Group>
              ))}
            </Group>
          </Stack>
        </Center>
      )}
    </Card>
  );
}

/** [1.d.II] Histogramme de l'évolution des salaires par mois. */
function MonthBarCard({ data }) {
  return (
    <Card withBorder padding="lg" radius="md" style={{ height: '420px' }}>
      <Title order={4} mb="lg">Évolution des salaires par mois</Title>
      {data.length === 0 ? (
        <NoData />
      ) : (
        <BarChart
          h={300}
          data={data}
          dataKey="month"
          series={[{ name: 'montant', color: 'indigo.6', label: 'Montant total' }]}
          tickLine="y"
          gridAxis="xy"
          valueFormatter={chartValueFormatter}
        />
      )}
    </Card>
  );
}

/** Tableau récapitulatif des totaux par mois. */
function MonthTableCard({ data }) {
  return (
    <Card withBorder padding="lg" radius="md">
      <Title order={4} mb="md">Détail des salaires par mois</Title>
      {data.length === 0 ? (
        <Text c="dimmed">Aucune donnée disponible</Text>
      ) : (
        <Table striped highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Mois / Période</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Total des Salaires</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((row) => (
              <Table.Tr key={row.month}>
                <Table.Td fw={500}>{row.month}</Table.Td>
                <Table.Td style={{ textAlign: 'right' }} fw={700}>
                  {formatAmount(row.montant)}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}
