import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Title,
  Text,
  Table,
  Badge,
  Stack,
  Group,
  Card,
  Alert,
  Loader,
  Center,
  Button,
  Divider,
} from '@mantine/core';
import { listEmployees } from '../../services/employeeService';
import { listSalaries, listPayments } from '../../services/salaryService';
import EmployeeAvatar from '../../components/EmployeeAvatar';
import { formatAmount, formatDate } from '../../utils/format';
import { totalPaid, remainingDue, paymentStatus } from '../../utils/payments';

export default function EmployeeDetail() {
  const { id } = useParams();
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
        setEmployees(realEmployees);
        setSalaries(salData);
        setPayments(payData);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les données de historique depuis Dolibarr.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const employee = employees.find((e) => String(e.id) === String(id));

  // Filter salaries for this employee
  const employeeSalaries = salaries.filter(
    (s) => String(s.fk_user) === String(id)
  );

  const getSalaryPayments = (salaryId) => {
    return payments
      .filter((p) => String(p.fk_salary) === String(salaryId))
      .map((p) => ({
        date: p.datepaye * 1000,
        montant: parseFloat(p.amount) || 0,
      }));
  };

  // Calculate global remaining due
  const globalRemaining = employeeSalaries.reduce((sum, sal) => {
    const salPayments = getSalaryPayments(sal.id);
    return sum + remainingDue(sal.amount, salPayments);
  }, 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'payé':
        return <Badge color="green">Payé</Badge>;
      case 'partiel':
        return <Badge color="orange">Partiel</Badge>;
      default:
        return <Badge color="red">Impayé</Badge>;
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
        <Button variant="light" style={{ width: 'fit-content' }} onClick={() => navigate('/salaries/details')}>
          Retour à la liste
        </Button>
        <Alert color="red" title="Erreur">
          {error}
        </Alert>
      </Stack>
    );
  }

  if (!employee) {
    return (
      <Stack p="md">
        <Button variant="light" style={{ width: 'fit-content' }} onClick={() => navigate('/salaries/details')}>
          Retour à la liste
        </Button>
        <Alert color="red" title="Salarié introuvable">
          Aucun salarié ne correspond à cet identifiant.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Button variant="light" onClick={() => navigate('/salaries/details')}>
          Retour à la liste
        </Button>
        <Title order={2}>Fiche salarié</Title>
      </Group>

      {/* Profil & Informations */}
      <Card withBorder padding="lg" radius="md">
        <Group gap="lg">
          <EmployeeAvatar
            userId={employee.id}
            photo={employee.photo}
            name={employee.lastname}
            size={70}
          />
          <div style={{ flex: 1 }}>
            <Title order={3}>{employee.lastname}</Title>
            <Text size="sm" c="dimmed">Identifiant : @{employee.login}</Text>
            <Group gap="xs" mt="xs">
              <Badge color="blue" variant="light">
                {employee.job || 'Poste non renseigné'}
              </Badge>
              <Badge color="gray" variant="light">
                {employee.weeklyhours
                  ? `${parseFloat(employee.weeklyhours)}h / semaine`
                  : 'Temps non spécifié'}
              </Badge>
            </Group>
          </div>
        </Group>
      </Card>

      {/* Résumé Reste à Payer */}
      <Card withBorder padding="lg" radius="md" bg="var(--mantine-color-gray-0)">
        <Group justify="space-between">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Reste à payer global
            </Text>
            <Text size="xl" fw={700} c={globalRemaining > 0 ? 'orange.7' : 'green.7'} mt="xs">
              {formatAmount(globalRemaining)}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Nombre de salaires
            </Text>
            <Text size="xl" fw={700} mt="xs">
              {employeeSalaries.length}
            </Text>
          </div>
        </Group>
      </Card>

      {/* Tableau de l'historique et des paiements */}
      <Card withBorder padding="lg" radius="md">
        <Title order={4} mb="md">Historique des salaires & paiements</Title>

        {employeeSalaries.length === 0 ? (
          <Text size="sm" c="dimmed" py="md">
            Aucun salaire enregistré pour ce salarié.
          </Text>
        ) : (
          <Table striped withTableBorder verticalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Période / Description</Table.Th>
                <Table.Th style={{ textAlign: 'right', width: '100px' }}>Montant</Table.Th>
                <Table.Th style={{ textAlign: 'right', width: '100px' }}>Reste</Table.Th>
                <Table.Th style={{ textAlign: 'center', width: '100px' }}>Statut</Table.Th>
                <Table.Th>Détails des paiements</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {employeeSalaries.map((sal) => {
                const salPayments = getSalaryPayments(sal.id);
                const due = remainingDue(sal.amount, salPayments);
                const status = paymentStatus(sal.amount, salPayments);

                return (
                  <Table.Tr key={sal.id}>
                    <Table.Td size="xs" style={{ verticalAlign: 'top' }}>
                      <Text fw={600} size="xs">
                        {formatDate(sal.datesp * 1000)} au {formatDate(sal.dateep * 1000)}
                      </Text>
                      <Text size="10px" c="dimmed" mt={4}>
                        Ref: #{sal.id}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right', verticalAlign: 'top' }} size="sm">
                      {formatAmount(sal.amount)}
                    </Table.Td>
                    <Table.Td
                      style={{ textAlign: 'right', verticalAlign: 'top' }}
                      size="sm"
                      fw={due > 0 ? 600 : 400}
                      c={due > 0 ? 'orange.7' : 'dimmed'}
                    >
                      {formatAmount(due)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center', verticalAlign: 'top' }}>
                      {getStatusBadge(status)}
                    </Table.Td>
                    <Table.Td size="xs">
                      {salPayments.length === 0 ? (
                        <Text size="xs" c="dimmed" italic>
                          Aucun versement
                        </Text>
                      ) : (
                        <Stack gap={4}>
                          {salPayments.map((p, idx) => (
                            <Group justify="space-between" key={idx} wrap="nowrap">
                              <Text size="11px">
                                Le {formatDate(p.date)}
                              </Text>
                              <Text size="11px" fw={600}>
                                {formatAmount(p.montant)}
                              </Text>
                            </Group>
                          ))}
                          <Divider my={4} variant="dashed" />
                          <Group justify="space-between" wrap="nowrap">
                            <Text size="11px" c="dimmed">Total payé</Text>
                            <Text size="11px" fw={700} c="green.7">
                              {formatAmount(totalPaid(salPayments))}
                            </Text>
                          </Group>
                        </Stack>
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
  );
}
