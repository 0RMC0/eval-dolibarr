import { useState } from 'react';
import { Button, Card, Divider, Grid, Stack, Text, TextInput, Title } from '@mantine/core';
import { listRealEmployees } from '../../services/employeeService';
import { createPeriodSalary } from '../../services/salaryService';
import { filterEmployees } from '../../utils/employeeFilters';
import { notifySuccess, notifyWarning } from '../../utils/notify';
import { useAsyncLoad } from '../../hooks/useAsyncLoad';
import { LoadingScreen, PageError } from '../../components/PageStates';
import EmployeeFilterCard from '../../components/EmployeeFilterCard';
import EmployeeSelectionTable from '../../components/EmployeeSelectionTable';
import GenerationReportModal from '../../components/GenerationReportModal';

const NO_FILTERS = { job: 'all', gender: 'all', hoursMin: '', hoursMax: '' };

// [J2 - 2.a] Génération d'un même salaire pour plusieurs salariés filtrés.
export default function SalaryBatchCreate() {
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState(NO_FILTERS);

  // Formulaire de génération
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [amount, setAmount] = useState('');
  const [generating, setGenerating] = useState(false);

  // Rapport de génération
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState(null);

  const { loading, error } = useAsyncLoad(async () => {
    setEmployees(await listRealEmployees());
  }, 'Impossible de charger les salariés.');

  const selected = filterEmployees(employees, filters);

  // Crée le même salaire pour chaque salarié sélectionné et renvoie le rapport.
  const generateSalaries = async (montant) => {
    const result = { success: 0, failed: [] };
    for (const emp of selected) {
      try {
        await createPeriodSalary({
          userId: emp.id,
          startIso: dateDebut,
          endIso: dateFin,
          amount: montant,
        });
        result.success++;
      } catch (err) {
        console.error(`Échec de génération pour ${emp.lastname}:`, err);
        result.failed.push({ name: emp.lastname, error: err.message || 'Erreur inconnue' });
      }
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selected.length === 0) {
      notifyWarning('Aucun salarié sélectionné.');
      return;
    }
    if (!dateDebut || !dateFin || !amount) {
      notifyWarning('Veuillez remplir tous les champs de génération.');
      return;
    }
    const montant = parseFloat(amount);
    if (isNaN(montant) || montant <= 0) {
      notifyWarning('Le montant doit être supérieur à 0.');
      return;
    }

    setGenerating(true);
    const result = await generateSalaries(montant);
    setGenerating(false);

    setReport(result);
    setReportOpen(true);

    if (result.success > 0) {
      notifySuccess(`${result.success} salaire(s) généré(s) avec succès.`);
      setDateDebut('');
      setDateFin('');
      setAmount('');
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <PageError title="Générer des salaires">{error}</PageError>;

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} mb="xs">Générer des salaires (par lot)</Title>
        <Text c="dimmed">
          Sélectionnez des salariés à l'aide des filtres pour leur attribuer un salaire en une seule opération
        </Text>
      </div>

      <Grid>
        {/* Colonne de gauche : filtres et aperçu */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            <EmployeeFilterCard employees={employees} filters={filters} onChange={setFilters} />
            <EmployeeSelectionTable selected={selected} total={employees.length} />
          </Stack>
        </Grid.Col>

        {/* Colonne de droite : paramètres de génération */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder padding="lg" radius="md">
            <Title order={4} mb="md">Paramètres de paie</Title>
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label="Date de début"
                  type="date"
                  required
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.currentTarget.value)}
                />

                <TextInput
                  label="Date de fin"
                  type="date"
                  required
                  value={dateFin}
                  onChange={(e) => setDateFin(e.currentTarget.value)}
                />

                <TextInput
                  label="Montant brut à générer (€)"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1500.00"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.currentTarget.value)}
                />

                <Divider my="sm" />

                <Button
                  type="submit"
                  color="blue"
                  size="md"
                  fullWidth
                  loading={generating}
                  disabled={selected.length === 0}
                >
                  Générer pour {selected.length} salarié(s)
                </Button>
              </Stack>
            </form>
          </Card>
        </Grid.Col>
      </Grid>

      <GenerationReportModal opened={reportOpen} onClose={() => setReportOpen(false)} report={report} />
    </Stack>
  );
}
