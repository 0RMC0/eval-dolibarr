import { Alert, Button, Group, Modal, Stack, Table, Text } from '@mantine/core';

// Les échecs "déjà payé / mois couvert" sont des cas normaux : affichés en gris.
function errorColor(failure) {
  const isNormalCase =
    failure.error.includes('couvert') || failure.error.includes('Déjà payé');
  return isNormalCase ? 'dimmed' : 'red';
}

/**
 * Compte rendu d'une génération de salaires par lot.
 * `report` = { success: nombre, failed: [{ name, error }] }.
 */
export default function GenerationReportModal({
  opened,
  onClose,
  report,
  successLabel = 'Salaires créés avec succès',
  failedLabel = 'Échecs de création',
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="Rapport de génération des salaires" size="md">
      {report && (
        <Stack gap="md">
          <Alert color={report.failed.length > 0 ? 'orange' : 'green'} title="Génération terminée">
            <Text size="sm">
              {successLabel} : <strong>{report.success}</strong>
            </Text>
            {report.failed.length > 0 && (
              <Text size="sm" mt="xs">
                {failedLabel} : <strong>{report.failed.length}</strong>
              </Text>
            )}
          </Alert>

          {report.failed.length > 0 && (
            <Stack gap="xs">
              <Text fw={600} size="sm">
                Détails :
              </Text>
              <Table striped withBorder size="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Salarié</Table.Th>
                    <Table.Th>Raison / Erreur</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {report.failed.map((f, i) => (
                    <Table.Tr key={i}>
                      <Table.Td fw={500}>{f.name}</Table.Td>
                      <Table.Td c={errorColor(f)}>{f.error}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          )}

          <Group justify="flex-end" mt="md">
            <Button onClick={onClose}>Fermer</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
