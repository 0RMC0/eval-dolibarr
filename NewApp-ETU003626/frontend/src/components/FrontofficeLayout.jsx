import { Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import SideNavShell from './SideNavShell';

const LINKS = [
  { to: '/salaries', label: 'Salariés' },
  { to: '/salaires/nouveau', label: 'Créer / payer un salaire' },
  { to: '/salaires/lot', label: 'Générer des salaires (Lot)' },
  { to: '/salaires/lot/day', label: 'Générer des salaires (Jour)' },
  { to: '/salaires/lot/day-weekend', label: 'Générer des salaires (Jour + week-end)' },
  { to: '/paiements/lot', label: 'Générer paiements' },
  { to: '/paiements/resultat', label: 'Résultat des paiements' },
  { to: '/salaries/details', label: 'Détails & Historique' },
];

export default function FrontofficeLayout() {
  const navigate = useNavigate();

  return (
    <SideNavShell
      sectionLabel="Navigation"
      links={LINKS}
      footer={
        <Button variant="light" color="blue" size="sm" fullWidth onClick={() => navigate('/admin')}>
          Accéder au Backoffice
        </Button>
      }
    />
  );
}
