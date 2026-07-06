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
  Button,
} from '@mantine/core';
import { listEmployees } from '../../services/employeeService';
import EmployeeAvatar from '../../components/EmployeeAvatar';

export default function EmployeeDetailList() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadEmployees() {
      try {
        setLoading(true);
        setError(null);
        const empData = await listEmployees();
        const realEmployees = empData.filter((u) => u.ref_employee && u.employee === '1');
        setEmployees(realEmployees);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger la liste des salariés depuis Dolibarr.');
      } finally {
        setLoading(false);
      }
    }
    loadEmployees();
  }, []);

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
        <Title order={2}>Historique des salariés</Title>
        <Alert color="red" title="Erreur">
          {error}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">Détails & Historique des salariés</Title>
        <Text c="dimmed">
          Sélectionnez un collaborateur pour afficher son historique de salaires et ses paiements correspondants
        </Text>
      </div>

      <Card withBorder padding="lg" radius="md">
        {employees.length === 0 ? (
          <Text c="dimmed" style={{ textAlign: 'center' }} py="xl">
            Aucun salarié enregistré.
          </Text>
        ) : (
          <Table striped highlightOnHover verticalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '60px' }}></Table.Th>
                <Table.Th>Nom</Table.Th>
                <Table.Th>Identifiant</Table.Th>
                <Table.Th>Poste</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Heures hebdo</Table.Th>
                <Table.Th style={{ width: '150px', textAlign: 'right' }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {employees.map((emp) => (
                <Table.Tr key={emp.id}>
                  <Table.Td>
                    <EmployeeAvatar
                      userId={emp.id}
                      photo={emp.photo}
                      name={emp.lastname}
                      size={36}
                    />
                  </Table.Td>
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
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Button
                      size="xs"
                      variant="outline"
                      color="blue"
                      onClick={() => navigate(`/salaries/details/${emp.id}`)}
                    >
                      Consulter la fiche
                    </Button>
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
