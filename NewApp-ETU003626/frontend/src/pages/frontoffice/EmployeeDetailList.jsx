import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, Stack, Table, Text, Title } from '@mantine/core';
import { listRealEmployees } from '../../services/employeeService';
import { useAsyncLoad } from '../../hooks/useAsyncLoad';
import { LoadingScreen, PageError } from '../../components/PageStates';
import EmployeeAvatar from '../../components/EmployeeAvatar';

// [J2 - 2.b] Liste (sans filtre) donnant accès à la fiche détaillée de chaque salarié.
export default function EmployeeDetailList() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);

  const { loading, error } = useAsyncLoad(async () => {
    setEmployees(await listRealEmployees());
  }, 'Impossible de charger la liste des salariés depuis Dolibarr.');

  if (loading) return <LoadingScreen />;
  if (error) return <PageError title="Historique des salariés">{error}</PageError>;

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
                    <EmployeeAvatar userId={emp.id} photo={emp.photo} name={emp.lastname} size={36} />
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
