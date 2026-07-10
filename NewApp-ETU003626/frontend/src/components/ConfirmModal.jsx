import { Button, Group, Modal, Stack, Text } from '@mantine/core';

/** Modale de confirmation générique (suppression, réinitialisation…). */
export default function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title = 'Confirmer',
  confirmLabel = 'Confirmer',
  confirmColor = 'red',
  loading = false,
  children,
}) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} size="sm">
      <Stack>
        <Text size="sm">{children}</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="light" color="gray" onClick={onClose}>
            Annuler
          </Button>
          <Button color={confirmColor} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
