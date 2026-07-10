import { Alert, Center, Loader, Stack, Title } from '@mantine/core';

/** États de page partagés : chargement plein écran et erreur bloquante. */

export function LoadingScreen() {
  return (
    <Center style={{ height: '70vh' }}>
      <Loader size="xl" />
    </Center>
  );
}

// `action` : élément optionnel affiché au-dessus (ex. bouton retour).
export function PageError({ title, alertTitle = 'Erreur', action, children }) {
  return (
    <Stack p="md">
      {action}
      {title && <Title order={2}>{title}</Title>}
      <Alert color="red" title={alertTitle}>
        {children}
      </Alert>
    </Stack>
  );
}
