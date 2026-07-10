import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Alert, Button, Card, Center, PasswordInput, Stack, Title } from '@mantine/core';
import { useAuth } from '../context/useAuth';

/**
 * Garde de route du backoffice. [J1 - 1.a]
 * Si déverrouillé -> rend les pages enfants (<Outlet/>).
 * Sinon -> formulaire de code (pré-rempli par défaut), vérifié auprès du backend.
 */
export default function CodeGate() {
  const { isUnlocked, unlock } = useAuth();
  // Code pré-rempli par défaut sur le formulaire (conforme au besoin J1).
  const [code, setCode] = useState(import.meta.env.VITE_BACKOFFICE_CODE || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isUnlocked) return <Outlet />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await unlock(code);
    setLoading(false);
    if (!ok) setError('Code incorrect.');
  };

  return (
    <Center h="70vh">
      <Card withBorder shadow="sm" padding="lg" radius="md" w={340}>
        <form onSubmit={submit}>
          <Stack>
            <Title order={3}>Backoffice — accès protégé</Title>
            {error && <Alert color="red">{error}</Alert>}
            <PasswordInput
              label="Code d'accès"
              value={code}
              onChange={(e) => setCode(e.currentTarget.value)}
              autoFocus
            />
            <Button type="submit" loading={loading}>
              Entrer
            </Button>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
