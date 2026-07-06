import { AppShell, Button, NavLink, ScrollArea, Text, Title, Stack, Divider } from '@mantine/core';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const backoffice = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/holidays', label: 'Jours fériés' },
  { to: '/admin/import', label: 'Import' },
  { to: '/admin/reset', label: 'Réinitialiser' },
];

export default function BackofficeLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { lock } = useAuth();

  const handleLogout = () => {
    lock();
    navigate('/salaries');
  };

  return (
    <AppShell navbar={{ width: 240, breakpoint: 'sm' }} padding="md">
      <AppShell.Navbar p="md">
        <ScrollArea style={{ height: '100%' }}>
          <Title order={4} mb="lg">ETU003626</Title>
          <Stack gap="sm">
            <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Administration</Text>
            {backoffice.map((item) => (
              <NavLink
                key={item.to}
                component={Link}
                to={item.to}
                label={item.label}
                active={pathname === item.to}
              />
            ))}

            <Divider my="md" />

            <Button variant="light" color="red" size="sm" fullWidth onClick={handleLogout}>
              Retour au Frontoffice
            </Button>
          </Stack>
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
