import { useEffect, useState } from 'react';
import { Title, Grid, Card, Text, Center, Loader, Alert, Stack, Group, Table } from '@mantine/core';
import { DonutChart, BarChart } from '@mantine/charts';
import { getSalaryByGender, getSalaryByMonth } from '../../services/dashboardService';
import { notifications } from '@mantine/notifications';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [genderData, setGenderData] = useState([]);
  const [monthData, setMonthData] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [gender, month] = await Promise.all([
          getSalaryByGender(),
          getSalaryByMonth(),
        ]);
        setGenderData(gender);
        setMonthData(month);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les données du tableau de bord depuis Dolibarr.");
        notifications.show({
          color: 'red',
          title: 'Erreur de chargement',
          message: err.message || 'Une erreur est survenue lors de la communication avec l\'API Dolibarr.',
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

  const totalSalaries = genderData.reduce((acc, curr) => acc + curr.value, 0);

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
        <Title order={2}>Tableau de bord</Title>
        <Alert color="red" title="Erreur">
          {error}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">Tableau de bord</Title>
        <Text c="dimmed">
          Vue d'ensemble des salaires cumulés issus de l'ERP Dolibarr
        </Text>
      </div>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder padding="lg" radius="md">
            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
              Masse Salariale Totale
            </Text>
            <Text size="xl" fw={700} mt="xs">
              {formatCurrency(totalSalaries)}
            </Text>
          </Card>
        </Grid.Col>
        
        {genderData.map((g) => (
          <Grid.Col span={{ base: 12, md: 4 }} key={g.name}>
            <Card withBorder padding="lg" radius="md">
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                Total {g.name}s
              </Text>
              <Text size="xl" fw={700} mt="xs" c={g.color}>
                {formatCurrency(g.value)}
              </Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Grid mt="md">
        {/* Graphique Genre */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md" style={{ height: '420px' }}>
            <Title order={4} mb="lg">Masse salariale par genre</Title>
            {genderData.length === 0 ? (
              <Center style={{ height: '300px' }}>
                <Text c="dimmed">Aucune donnée disponible</Text>
              </Center>
            ) : (
              <Center style={{ height: '300px' }}>
                <Stack align="center" gap="xs">
                  <DonutChart
                    data={genderData}
                    size={180}
                    thickness={25}
                    withTooltip
                    valueFormatter={(value) => `${value.toLocaleString('fr-FR')} MGA`}
                  />
                  <Group justify="center" gap="md" mt="sm">
                    {genderData.map((item) => (
                      <Group gap={6} key={item.name}>
                        <Text size="xs" fw={500} c={item.color}>
                          ● {item.name} : {((item.value / totalSalaries) * 100).toFixed(1)}% ({formatCurrency(item.value)})
                        </Text>
                      </Group>
                    ))}
                  </Group>
                </Stack>
              </Center>
            )}
          </Card>
        </Grid.Col>

        {/* Graphique Évolution par Mois */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md" style={{ height: '420px' }}>
            <Title order={4} mb="lg">Évolution des salaires par mois</Title>
            {monthData.length === 0 ? (
              <Center style={{ height: '300px' }}>
                <Text c="dimmed">Aucune donnée disponible</Text>
              </Center>
            ) : (
              <BarChart
                h={300}
                data={monthData}
                dataKey="month"
                series={[{ name: 'montant', color: 'indigo.6', label: 'Montant total' }]}
                tickLine="y"
                gridAxis="xy"
                valueFormatter={(value) => `${value.toLocaleString('fr-FR')} MGA`}
              />
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Tableau détaillé des salaires par mois */}
      <Card withBorder padding="lg" radius="md">
        <Title order={4} mb="md">Détail des salaires par mois</Title>
        {monthData.length === 0 ? (
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
              {monthData.map((row) => (
                <Table.Tr key={row.month}>
                  <Table.Td fw={500}>{row.month}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }} fw={700}>
                    {formatCurrency(row.montant)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}

