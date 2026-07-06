import { AppShell, Button, NavLink, ScrollArea, Text, Title, Stack, Divider } from '@mantine/core';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const frontoffice = [
  { to: '/salaries', label: 'Salariés' },
  { to: '/salaires/nouveau', label: 'Créer / payer un salaire' },
  { to: '/salaires/lot', label: 'Générer des salaires (Lot)' },
  { to: '/salaries/details', label: 'Détails & Historique' },
];

export default function FrontofficeLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <AppShell navbar={{ width: 240, breakpoint: 'sm' }} padding="md">
      <AppShell.Navbar p="md">
        <ScrollArea style={{ height: '100%' }}>
          <Title order={4} mb="lg">ETU003626</Title>
          <Stack gap="sm">
            <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Navigation</Text>
            {frontoffice.map((item) => (
              <NavLink
                key={item.to}
                component={Link}
                to={item.to}
                label={item.label}
                active={pathname === item.to}
              />
            ))}

            <Divider my="md" />

            <Button variant="light" color="blue" size="sm" fullWidth onClick={() => navigate('/admin')}>
              Accéder au Backoffice
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
