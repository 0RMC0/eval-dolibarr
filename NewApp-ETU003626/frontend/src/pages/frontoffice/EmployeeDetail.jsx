import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { listRealEmployees } from '../../services/employeeService';
import { listSalaries, listPayments } from '../../services/salaryService';
import { paymentsForSalary, totalPaid, remainingDue, paymentStatus } from '../../utils/payments';
import { formatAmount, formatDate } from '../../utils/format';
import { toJsDate } from '../../utils/dates';
import { useAsyncLoad } from '../../hooks/useAsyncLoad';
import { LoadingScreen, PageError } from '../../components/PageStates';
import PaymentStatusBadge from '../../components/PaymentStatusBadge';
import EmployeeAvatar from '../../components/EmployeeAvatar';

// [J2 - 2.b] Fiche détaillée : profil, reste à payer global, historique complet.
export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [payments, setPayments] = useState([]);

  const { loading, error } = useAsyncLoad(async () => {
    const [empData, salData, payData] = await Promise.all([
      listRealEmployees(),
      listSalaries(),
      listPayments(),
    ]);
    setEmployees(empData);
    setSalaries(salData);
    setPayments(payData);
  }, "Impossible de charger les données de historique depuis Dolibarr.");

  const employee = employees.find((e) => String(e.id) === String(id));
  const employeeSalaries = salaries.filter((s) => String(s.fk_user) === String(id));

  // Reste à payer cumulé sur tous les salaires de l'employé.
  const globalRemaining = employeeSalaries.reduce(
    (sum, sal) => sum + remainingDue(sal.amount, paymentsForSalary(payments, sal.id)),
    0
  );

  const backButton = (
    <Button variant="light" style={{ width: 'fit-content' }} onClick={() => navigate('/salaries/details')}>
      Retour à la liste
    </Button>
  );

  if (loading) return <LoadingScreen />;
  if (error) return <PageError action={backButton}>{error}</PageError>;
  if (!employee) {
    return (
      <PageError action={backButton} alertTitle="Salarié introuvable">
        Aucun salarié ne correspond à cet identifiant.
      </PageError>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        {backButton}
        <Title order={2}>Fiche salarié</Title>
      </Group>

      <ProfileCard employee={employee} />
      <SummaryCard remaining={globalRemaining} salaryCount={employeeSalaries.length} />
      <HistoryCard salaries={employeeSalaries} payments={payments} />
    </Stack>
  );
}

/** Profil : photo, identifiant, poste, temps de travail. */
function ProfileCard({ employee }) {
  return (
    <Card withBorder padding="lg" radius="md">
      <Group gap="lg">
        <EmployeeAvatar userId={employee.id} photo={employee.photo} name={employee.lastname} size={70} />
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
  );
}

/** Indicateurs : reste à payer global + nombre de salaires. */
function SummaryCard({ remaining, salaryCount }) {
  return (
    <Card withBorder padding="lg" radius="md" bg="var(--mantine-color-gray-0)">
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Reste à payer global
          </Text>
          <Text size="xl" fw={700} c={remaining > 0 ? 'orange.7' : 'green.7'} mt="xs">
            {formatAmount(remaining)}
          </Text>
        </div>
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Nombre de salaires
          </Text>
          <Text size="xl" fw={700} mt="xs">
            {salaryCount}
          </Text>
        </div>
      </Group>
    </Card>
  );
}

/** Historique des salaires avec le détail des versements de chacun. */
function HistoryCard({ salaries, payments }) {
  return (
    <Card withBorder padding="lg" radius="md">
      <Title order={4} mb="md">Historique des salaires & paiements</Title>

      {salaries.length === 0 ? (
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
            {salaries.map((sal) => {
              const salPayments = paymentsForSalary(payments, sal.id);
              const due = remainingDue(sal.amount, salPayments);

              return (
                <Table.Tr key={sal.id}>
                  <Table.Td size="xs" style={{ verticalAlign: 'top' }}>
                    <Text fw={600} size="xs">
                      {formatDate(toJsDate(sal.datesp))} au {formatDate(toJsDate(sal.dateep))}
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
                    <PaymentStatusBadge status={paymentStatus(sal.amount, salPayments)} />
                  </Table.Td>
                  <Table.Td size="xs">
                    <PaymentsCell payments={salPayments} />
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}

/** Liste des versements d'un salaire + total payé. */
function PaymentsCell({ payments }) {
  if (payments.length === 0) {
    return (
      <Text size="xs" c="dimmed" italic>
        Aucun versement
      </Text>
    );
  }

  return (
    <Stack gap={4}>
      {payments.map((p, idx) => (
        <Group justify="space-between" key={idx} wrap="nowrap">
          <Text size="11px">Le {formatDate(p.date)}</Text>
          <Text size="11px" fw={600}>{formatAmount(p.montant)}</Text>
        </Group>
      ))}
      <Divider my={4} variant="dashed" />
      <Group justify="space-between" wrap="nowrap">
        <Text size="11px" c="dimmed">Total payé</Text>
        <Text size="11px" fw={700} c="green.7">
          {formatAmount(totalPaid(payments))}
        </Text>
      </Group>
    </Stack>
  );
}
