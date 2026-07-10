import { useState } from 'react';
import {
  Alert,
  Badge,
  Card,
  Group,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { listRealEmployees } from '../../services/employeeService';
import { listSalaries, listPayments } from '../../services/salaryService';
import { toJsDate } from '../../utils/dates';
import { formatAmount, formatDate } from '../../utils/format';
import { useAsyncLoad } from '../../hooks/useAsyncLoad';
import { LoadingScreen, PageError } from '../../components/PageStates';

/**
 * Résultat des paiements : chaque paiement effectué, dans l'ordre d'exécution
 * (donc l'ordre de priorité appliqué par "Générer paiements").
 * Colonnes : date de paiement, date de début du salaire, salarié, poste, montant.
 */
export default function PaymentResultList() {
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [payments, setPayments] = useState([]);

  // Filtre optionnel : mois de la date de paiement ("aaaa-mm", vide = tout).
  const [period, setPeriod] = useState('');

  const { loading, error } = useAsyncLoad(async () => {
    const [empData, salData, payData] = await Promise.all([
      listRealEmployees(),
      listSalaries(),
      listPayments(),
    ]);
    setEmployees(empData);
    setSalaries(salData);
    setPayments(payData);
  }, 'Impossible de charger les paiements.');

  // Dictionnaires de jointure (clés en String : Dolibarr mélange nombres et chaînes).
  const salaryById = {};
  for (const sal of salaries) salaryById[String(sal.id)] = sal;
  const employeeById = {};
  for (const emp of employees) employeeById[String(emp.id)] = emp;

  // Un paiement -> une ligne complète (paiement + salaire + employé).
  const rows = payments
    .map((pay) => {
      const salary = salaryById[String(pay.fk_salary)];
      const employee = salary ? employeeById[String(salary.fk_user)] : null;
      if (!salary || !employee) return null; // paiement orphelin : ignoré
      return {
        id: pay.id,
        paymentDate: toJsDate(pay.datepaye),
        startDate: toJsDate(salary.datesp),
        lastname: employee.lastname,
        job: employee.job || 'Non spécifié',
        amount: parseFloat(pay.amount) || 0,
      };
    })
    .filter((row) => row !== null)
    // Filtre par mois de paiement si renseigné.
    .filter((row) => {
      if (!period) return true;
      const [year, month] = period.split('-').map(Number);
      return (
        row.paymentDate !== null &&
        row.paymentDate.getFullYear() === year &&
        row.paymentDate.getMonth() + 1 === month
      );
    })
    // Ordre d'exécution : date de paiement croissante, puis id croissant
    // (les ids suivent l'ordre de création, donc l'ordre de priorité).
    .sort((a, b) => a.paymentDate - b.paymentDate || Number(a.id) - Number(b.id));

  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  if (loading) return <LoadingScreen />;
  if (error) return <PageError title="Résultat des paiements">{error}</PageError>;

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">Résultat des paiements</Title>
        <Text c="dimmed">
          Les paiements effectués, dans leur ordre d'exécution (priorité de poste puis
          date de début de salaire)
        </Text>
      </div>

      <Card withBorder padding="lg" radius="md" maw={320}>
        <TextInput
          label="Mois de paiement (optionnel)"
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.currentTarget.value)}
        />
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>Paiements ({rows.length})</Title>
          <Badge size="lg" color={rows.length > 0 ? 'blue' : 'gray'}>
            Total payé : {formatAmount(total)}
          </Badge>
        </Group>

        {rows.length === 0 ? (
          <Alert color="orange" title="Aucun paiement">
            Aucun paiement trouvé{period ? ' pour ce mois' : ''}.
          </Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Date paiement</Table.Th>
                <Table.Th>Date début salaire</Table.Th>
                <Table.Th>Salarié</Table.Th>
                <Table.Th>Poste</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Montant payé</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row, index) => (
                <Table.Tr key={row.id}>
                  <Table.Td c="dimmed">{index + 1}</Table.Td>
                  <Table.Td>{formatDate(row.paymentDate)}</Table.Td>
                  <Table.Td>{formatDate(row.startDate)}</Table.Td>
                  <Table.Td fw={600}>{row.lastname}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="gray">{row.job}</Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }} fw={600}>
                    {formatAmount(row.amount)}
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
