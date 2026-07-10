import { useState } from 'react';
import { Alert, Button, Card, FileInput, Group, List, Stack, Text, Title } from '@mantine/core';
import { importData } from '../../services/adminService';
import { notifyError, notifySuccess } from '../../utils/notify';

// [J1 - 1.c] Import des CSV employés/salaires et du ZIP de photos.
// Chaque fichier est optionnel : on peut importer un par un ou tout ensemble.
export default function ImportData() {
  const [employes, setEmployes] = useState(null);
  const [salaires, setSalaires] = useState(null);
  const [images, setImages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const hasFile = employes || salaires || images;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setReport(null);
    try {
      setReport(await importData({ employes, salaires, images }));
      notifySuccess('Import terminé.');
    } catch (err) {
      notifyError('Échec de l’import', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack maw={640}>
      <Title order={2}>Importer les données</Title>
      <Text c="dimmed" size="sm">
        Feuille 1 = employés, Feuille 2 = salaires, ZIP = photos des employés
        (nom de fichier = référence employé).
      </Text>

      <Card withBorder padding="lg" radius="md">
        <form onSubmit={submit}>
          <Stack>
            <FileInput
              label="Employés (CSV — Feuille 1)"
              placeholder="Sélectionner le fichier des employés"
              accept=".csv"
              value={employes}
              onChange={setEmployes}
              clearable
            />
            <FileInput
              label="Salaires (CSV — Feuille 2)"
              placeholder="Sélectionner le fichier des salaires"
              accept=".csv"
              value={salaires}
              onChange={setSalaires}
              clearable
            />
            <FileInput
              label="Photos (ZIP)"
              placeholder="Sélectionner le fichier des photos"
              accept=".zip"
              value={images}
              onChange={setImages}
              clearable
            />
            <Group justify="flex-end">
              <Button type="submit" loading={loading} disabled={!hasFile}>
                Lancer l’import
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>

      {report && <ImportReport report={report} />}
    </Stack>
  );
}

/** Rapport d'import : compteurs + erreurs détaillées par section. */
function ImportReport({ report }) {
  const sections = [
    { key: 'employes', label: 'Employés créés', ok: report.employes.crees, errs: report.employes.erreurs },
    { key: 'salaires', label: 'Salaires créés', ok: report.salaires.crees, errs: report.salaires.erreurs },
    { key: 'paiements', label: 'Paiements créés', ok: report.paiements.crees, errs: report.paiements.erreurs },
    { key: 'photos', label: 'Photos associées', ok: report.photos.associees, errs: report.photos.erreurs },
  ];

  return (
    <Card withBorder padding="lg" radius="md">
      <Title order={4} mb="sm">Résultat</Title>
      <Stack gap="sm">
        {sections.map((s) => (
          <div key={s.key}>
            <Text fw={600}>
              {s.label} : {s.ok}
              {s.errs.length > 0 && ` — ${s.errs.length} erreur(s)`}
            </Text>
            {s.errs.length > 0 && (
              <Alert color="red" mt={4} variant="light">
                <List size="xs">
                  {s.errs.map((err, i) => (
                    <List.Item key={i}>
                      {(err.ref || err.refSalaire || err.fichier) ?? ''} : {err.message}
                    </List.Item>
                  ))}
                </List>
              </Alert>
            )}
          </div>
        ))}
      </Stack>
    </Card>
  );
}
