import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Title,
  Text,
  Table,
  Badge,
  Stack,
  Card,
  Alert,
  Loader,
  Center,
} from '@mantine/core';
import { listEmployees } from '../../services/employeeService';
import { listSalaries, listPayments } from '../../services/salaryService';
import { formatAmount } from '../../utils/format';
import { remainingDue } from '../../utils/payments';

export default function SalaryTracking() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [empData, salData, payData] = await Promise.all([
          listEmployees(),
          listSalaries(),
          listPayments(),
        ]);
        const realEmployees = empData.filter((u) => u.ref_employee && u.employee === '1');
        // Sort employees alphabetically by name
        realEmployees.sort((a, b) => a.lastname.localeCompare(b.lastname));
        setEmployees(realEmployees);
        setSalaries(salData);
        setPayments(payData);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les données de suivi.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper to extract period key (YYYY-MM) and label (Mois Année)
  const getPeriodInfo = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const label = `${months[month]} ${year}`;
    return { key, label };
  };

  // Group all salaries to find unique periods
  const periodsMap = new Map();
  salaries.forEach((sal) => {
    if (sal.datesp) {
      const { key, label } = getPeriodInfo(sal.datesp);
      periodsMap.set(key, label);
    }
  });

  // Sort periods chronologically
  const sortedPeriodKeys = Array.from(periodsMap.keys()).sort();

  const getSalaryPayments = (salaryId) => {
    return payments
      .filter((p) => String(p.fk_salary) === String(salaryId))
      .map((p) => ({
        date: p.datepaye * 1000,
        montant: parseFloat(p.amount) || 0,
      }));
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
        <Title order={2}>Suivi des salaires</Title>
        <Alert color="red" title="Erreur">
          {error}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">Suivi des salaires</Title>
        <Text c="dimmed">
          Tableau récapitulatif des restes à payer par mois et par collaborateur. Cliquez sur un montant pour ouvrir la fiche détaillée.
        </Text>
      </div>

      <Card withBorder padding="lg" radius="md">
        {sortedPeriodKeys.length === 0 ? (
          <Text c="dimmed" style={{ textAlign: 'center' }} py="xl">
            Aucun salaire enregistré pour le moment.
          </Text>
        ) : (
          <Table striped withTableBorder highlightOnHover verticalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '180px' }}>Période</Table.Th>
                {employees.map((emp) => (
                  <Table.Th key={emp.id} style={{ textAlign: 'right' }}>
                    {emp.lastname}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedPeriodKeys.map((periodKey) => {
                const periodLabel = periodsMap.get(periodKey);
                return (
                  <Table.Tr key={periodKey}>
                    <Table.Td fw={600}>{periodLabel}</Table.Td>
                    {employees.map((emp) => {
                      const empSalaries = salaries.filter((sal) => {
                        if (String(sal.fk_user) !== String(emp.id)) return false;
                        const info = getPeriodInfo(sal.datesp);
                        return info.key === periodKey;
                      });

                      if (empSalaries.length === 0) {
                        return (
                          <Table.Td key={emp.id} style={{ textAlign: 'right', color: 'var(--mantine-color-gray-4)' }}>
                            -
                          </Table.Td>
                        );
                      }

                      // Calculate sum of remaining due
                      const totalDue = empSalaries.reduce((sum, sal) => {
                        const salPayments = getSalaryPayments(sal.id);
                        return sum + remainingDue(sal.amount, salPayments);
                      }, 0);

                      const isSettled = totalDue === 0;

                      return (
                        <Table.Td key={emp.id} style={{ textAlign: 'right' }}>
                          <Badge
                            size="md"
                            variant="light"
                            color={isSettled ? 'green' : 'orange'}
                            style={{ cursor: 'pointer', textTransform: 'none' }}
                            onClick={() => navigate(`/salaries/details/${emp.id}`)}
                            title="Consulter la fiche détaillée"
                          >
                            {formatAmount(totalDue)}
                          </Badge>
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}
