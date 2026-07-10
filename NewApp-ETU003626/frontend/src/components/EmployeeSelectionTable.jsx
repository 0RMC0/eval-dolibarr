import { Alert, Badge, Card, Group, Table, Title } from '@mantine/core';

/**
 * Aperçu des salariés retenus par les filtres (page de génération par lot).
 * `selected` : salariés filtrés · `total` : nombre total de salariés.
 */
export default function EmployeeSelectionTable({ selected, total }) {
  return (
    <Card withBorder padding="lg" radius="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>Salariés sélectionnés ({selected.length})</Title>
        <Badge size="lg" color={selected.length > 0 ? 'blue' : 'gray'}>
          {selected.length} / {total} au total
        </Badge>
      </Group>

      {selected.length === 0 ? (
        <Alert color="orange" title="Aucune cible">
          Aucun salarié ne correspond aux critères de filtres actuels.
        </Alert>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nom</Table.Th>
              <Table.Th>Identifiant</Table.Th>
              <Table.Th>Poste</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Heures hebdo</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {selected.map((emp) => (
              <Table.Tr key={emp.id}>
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
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}
