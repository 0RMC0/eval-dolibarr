import { AppShell, Divider, NavLink, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { Link, Outlet, useLocation } from 'react-router-dom';

/**
 * Coquille commune des layouts : barre latérale (titre, section, liens) + contenu.
 * `links` = [{ to, label }] ; `footer` : élément affiché sous le séparateur.
 */
export default function SideNavShell({ sectionLabel, links, footer }) {
  const { pathname } = useLocation();

  return (
    <AppShell navbar={{ width: 240, breakpoint: 'sm' }} padding="md">
      <AppShell.Navbar p="md">
        <ScrollArea style={{ height: '100%' }}>
          <Title order={4} mb="lg">ETU003626</Title>
          <Stack gap="sm">
            <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
              {sectionLabel}
            </Text>
            {links.map((item) => (
              <NavLink
                key={item.to}
                component={Link}
                to={item.to}
                label={item.label}
                active={pathname === item.to}
              />
            ))}

            <Divider my="md" />
            {footer}
          </Stack>
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
