# Les patterns du projet — expliqués lentement

Cinq structures reviennent dans toutes les pages. Une fois comprises,
tu peux lire n'importe quel fichier du projet.

## 1. Le chargement de page : `useAsyncLoad`

Toutes les pages commencent pareil :

```jsx
const [employees, setEmployees] = useState([]);

const { loading, error, reload } = useAsyncLoad(async () => {
  setEmployees(await listRealEmployees());
}, 'Impossible de charger les salariés.');

if (loading) return <LoadingScreen />;
if (error) return <PageError title="Ma page">{error}</PageError>;
// ...ici les données sont prêtes
```

Ce qui se passe :
1. À l'arrivée sur la page, le hook exécute ta fonction de chargement.
2. Pendant ce temps `loading` est vrai → on affiche le spinner.
3. Si ça plante, `error` contient ton message → on affiche la page d'erreur.
4. Sinon les `setXxx` ont rempli les états → la page s'affiche.

**`reload()`** : à appeler après chaque création/modification/suppression pour
rafraîchir les données affichées :

```jsx
await createPeriodSalary({ ... });
notifySuccess('Créé !');
await reload();   // les listes se mettent à jour
```

(Sous le capot, `reload` incrémente un compteur qui relance l'effet de
chargement — tu n'as pas besoin d'y penser.)

Charger PLUSIEURS choses en parallèle :

```jsx
const { loading, error, reload } = useAsyncLoad(async () => {
  const [empData, salData] = await Promise.all([listRealEmployees(), listSalaries()]);
  setEmployees(empData);
  setSalaries(salData);
}, '...');
```

## 2. La modale conditionnelle

Pour éditer/payer UN élément d'une liste, on stocke *l'élément sélectionné*
(pas un booléen) :

```jsx
// null = modale fermée ; un salaire = modale ouverte sur ce salaire
const [salaryToPay, setSalaryToPay] = useState(null);

// Dans la liste :
<Button onClick={() => setSalaryToPay(salary)}>Payer</Button>

// En bas de la page :
{salaryToPay && (
  <PaymentModal
    salary={salaryToPay}
    onClose={() => setSalaryToPay(null)}
    onSubmit={handleAddPayment}
  />
)}
```

Astuce du `{salaryToPay && ...}` : la modale est complètement **démontée** à la
fermeture. À la prochaine ouverture, ses champs repartent de zéro — pas besoin
de les vider à la main.

## 3. Le formulaire local qui prévient son parent

Les gros formulaires sont des sous-composants qui gèrent leurs champs
eux-mêmes et remontent seulement le résultat :

```jsx
// Sous-composant : possède ses états de champs
function NewSalaryForm({ onSubmit }) {
  const [amount, setAmount] = useState('');
  // ...

  const handleSubmit = async (e) => {
    e.preventDefault();
    // validations locales (notifyWarning + return si invalide)
    const ok = await onSubmit({ amount: parseFloat(amount), ... });
    if (ok) setAmount('');   // le parent a dit "réussi" -> on vide les champs
  };
}

// Parent : fait l'appel réseau, renvoie true/false
const handleCreateSalary = async (data) => {
  try {
    await createPeriodSalary({ userId: selectedEmployeeId, ...data });
    await reload();
    return true;
  } catch (err) {
    notifyError('Échec de la création', err);
    return false;
  }
};
```

Répartition : **l'enfant** possède les champs et la validation de saisie ;
**le parent** possède l'appel réseau et le rechargement.

## 4. La confirmation destructive : `ConfirmModal`

Toute action irréversible (supprimer, réinitialiser) passe par une confirmation :

```jsx
const [confirmOpen, setConfirmOpen] = useState(false);

<Button color="red" onClick={() => setConfirmOpen(true)}>Réinitialiser</Button>

<ConfirmModal
  opened={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  onConfirm={runReset}
  title="Confirmer"
  message="Confirmer la suppression définitive ?"
/>
```

Exemples réels : `ResetData.jsx`, `Holidays.jsx`.

## 5. Les notifications : `utils/notify.js`

Trois fonctions, toujours les mêmes :

```js
notifySuccess('Salaire créé.');                    // vert
notifyWarning('Veuillez remplir tous les champs.'); // orange (validation)
notifyError('Échec de la création', err);           // rouge (catch d'un appel réseau)
```

`notifyError` sait extraire le vrai message d'une erreur axios/Dolibarr —
passe-lui l'erreur du `catch` telle quelle.

## Bonus : pourquoi `String(a) === String(b)` ?

L'API Dolibarr renvoie les ids tantôt en nombre (`5`), tantôt en chaîne (`"5"`).
En JavaScript `5 === "5"` est **faux**. D'où les conversions avant comparaison :

```js
salaries.filter((s) => String(s.fk_user) === String(emp.id))
```

Si une liste "vide" t'étonne un jour, vérifie d'abord ça.
