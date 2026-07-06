import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  FileInput,
  Group,
  List,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { importData } from '../../services/adminService';

export default function ImportData() {
  const [employes, setEmployes] = useState(null);
  const [salaires, setSalaires] = useState(null);
  const [images, setImages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setReport(null);
    try {
      const result = await importData({ employes, salaires, images });
      setReport(result);
      notifications.show({ color: 'green', message: 'Import terminé.' });
    } catch (err) {
      const message = err.response?.data?.error || err.message;
      notifications.show({ color: 'red', title: 'Échec de l’import', message });
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
              <Button type="submit" loading={loading} disabled={!employes && !salaires && !images}>
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
