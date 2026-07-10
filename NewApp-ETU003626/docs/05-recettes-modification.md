# Recettes de modification — pas à pas

Chaque recette liste les fichiers à toucher, dans l'ordre. Avant de commencer,
lis [04-structure-projet.md](04-structure-projet.md) pour la règle d'or.

## Recette 1 — Ajouter une page frontoffice

1. Créer `frontend/src/pages/frontoffice/MaPage.jsx` :

```jsx
import { useState } from 'react';
import { Stack, Title } from '@mantine/core';
import { listRealEmployees } from '../../services/employeeService';
import { useAsyncLoad } from '../../hooks/useAsyncLoad';
import { LoadingScreen, PageError } from '../../components/PageStates';

export default function MaPage() {
  const [employees, setEmployees] = useState([]);

  const { loading, error } = useAsyncLoad(async () => {
    setEmployees(await listRealEmployees());
  }, 'Message si le chargement échoue.');

  if (loading) return <LoadingScreen />;
  if (error) return <PageError title="Ma page">{error}</PageError>;

  return (
    <Stack>
      <Title order={2}>Ma page</Title>
      {/* contenu */}
    </Stack>
  );
}
```

2. Déclarer la route dans `frontend/src/App.jsx` (bloc FrontofficeLayout) :
   `<Route path="ma-page" element={<MaPage />} />` + l'import en haut du fichier.
3. Ajouter le lien dans `frontend/src/components/FrontofficeLayout.jsx` (tableau `LINKS`).

Pour une page **backoffice** : même chose mais route dans le bloc `admin` de
App.jsx et lien dans `BackofficeLayout.jsx` — elle sera automatiquement
protégée par le code.

## Recette 2 — Ajouter un champ à un formulaire

Exemple : ajouter une "note" à la création de salaire (`SalaryCreate.jsx`,
composant `NewSalaryForm`).

1. Un état : `const [note, setNote] = useState('');`
2. Un champ dans le JSX :
   `<TextInput label="Note" value={note} onChange={(e) => setNote(e.currentTarget.value)} />`
3. Le passer au submit : `onSubmit({ dateDebut, dateFin, amount: val, note })`
4. Si Dolibarr doit le recevoir : ajouter le champ dans `createPeriodSalary`
   (`services/salaryService.js`), ex. `note_private: note`.

## Recette 3 — Appeler une nouvelle API Dolibarr

1. Ajouter la fonction dans le bon service (ex. `services/employeeService.js`) :

```js
export function updateEmployee(id, data) {
  return dolibarr.put(`/users/${id}`, data).then((r) => r.data);
}
```

2. L'utiliser dans une page :

```js
await updateEmployee(emp.id, { job: 'Nouveau poste' });
notifySuccess('Employé mis à jour.');
await reload();
```

Endpoints disponibles : `HANDOFF.md` §9 (racine du projet) et l'explorer
Dolibarr : `http://localhost:800/dolibarr/htdocs/api/index.php/explorer`.

## Recette 4 — Ajouter un endpoint backend

Voir [07-backend.md](07-backend.md) pour le détail des couches. En résumé :

1. `backend/src/controllers/xxx.controller.js` — fonction `(req, res, next)`.
2. `backend/src/routes/xxx.routes.js` — `router.get('/', handler)`.
3. `backend/src/server.js` — `app.use('/api/xxx', requireBackofficeCode, xxxRoutes);`
4. Frontend : la fonction d'appel dans `services/adminService.js` (client `backend`).

## Recette 5 — Ajouter un critère de filtre des salariés

1. `utils/employeeFilters.js` : écrire un petit `matchesXxx(emp, valeur)` et
   l'ajouter dans le `filter` de `filterEmployees`.
2. Dans la page : ajouter l'état + le champ, et passer le critère à
   `filterEmployees(employees, { ...critères })`.
3. Si le filtre sert aux pages "par lot" : ajouter le champ dans
   `components/EmployeeFilterCard.jsx`.

## Recette 6 — Modifier le calcul "tarif journalier / jours fériés"

Tout est dans `utils/salaryCalc.js` (fonctions pures, pas de React) :

- `unpaidIntervals` — quelles plages du mois ne sont pas encore payées
- `countHolidays` — combien de jours fériés dans une plage
- `intervalDetail` — le montant d'une plage — **la règle "férié = x2" vit ici**
- `monthlySalaryPlan` — la synthèse utilisée par la page

L'aperçu du tableau ET la génération utilisent les mêmes fonctions : une
modification ici est automatiquement cohérente partout.

## Recette 7 — Les paiements d'un salaire

- **Afficher** : `paymentsForSalary`, `totalPaid`, `remainingDue`,
  `paymentStatus` — tout dans `utils/payments.js`.
- **Enregistrer** : `addPayment(salaryId, { dateIso, amount })` dans
  `salaryService.js`. Ne jamais construire le payload Dolibarr dans une page.

## Recette 8 — Ajouter une colonne à un tableau

1. Trouver le `<Table>` dans la page.
2. Ajouter un `<Table.Th>` dans l'en-tête (`Thead`).
3. Ajouter le `<Table.Td>` correspondant dans le `.map` du corps (`Tbody`),
   à la même position.

```jsx
<Table.Th>Poste</Table.Th>                      // 2. en-tête
<Table.Td>{emp.job || 'Non spécifié'}</Table.Td> // 3. cellule
```

## Vérifier après chaque modif

```bash
cd frontend && npm run build     # compile ? pas d'import cassé
npx eslint src                   # règles de code respectées
```
