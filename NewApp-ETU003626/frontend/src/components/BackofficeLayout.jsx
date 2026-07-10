import { Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import SideNavShell from './SideNavShell';

const LINKS = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/holidays', label: 'Jours fériés' },
  { to: '/admin/import', label: 'Import' },
  { to: '/admin/reset', label: 'Réinitialiser' },
];

export default function BackofficeLayout() {
  const navigate = useNavigate();
  const { lock } = useAuth();

  // Verrouille le backoffice et revient au frontoffice.
  const handleLogout = () => {
    lock();
    navigate('/salaries');
  };

  return (
    <SideNavShell
      sectionLabel="Administration"
      links={LINKS}
      footer={
        <Button variant="light" color="red" size="sm" fullWidth onClick={handleLogout}>
          Retour au Frontoffice
        </Button>
      }
    />
  );
}
