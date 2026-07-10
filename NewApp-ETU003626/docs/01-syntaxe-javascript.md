# Syntaxe JavaScript moderne (utilisée dans ce projet)

Chaque section : la syntaxe → ce que ça veut dire → un exemple réel du projet.

## 1. Fonctions fléchées `=>`

```js
// Ces deux écritures sont équivalentes :
function double(x) { return x * 2; }
const double = (x) => x * 2;          // sans accolades = "return" implicite

// Avec accolades, il faut écrire return :
const double = (x) => { return x * 2; };
```

Dans le projet, presque toutes les fonctions sont fléchées :

```js
// frontend/src/services/employeeService.js
export function listEmployees(params = {}) {
  return dolibarr.get('/users', { params }).then((r) => r.data);
  //                                              ^^^^^^^^^^^^^^
  //                             fonction fléchée : reçoit r, renvoie r.data
}
```

⚠️ Piège : `(x) => ({ nom: x })` — pour renvoyer un objet sans `return`,
il faut des parenthèses autour des accolades, sinon JS croit que c'est un bloc.

## 2. Destructuring (déballage)

Extraire des propriétés d'un objet ou d'un tableau en une ligne :

```js
const employe = { nom: 'Rakotobe', poste: 'Comptable', heures: 35 };

// Au lieu de :
const nom = employe.nom;
const poste = employe.poste;

// On écrit :
const { nom, poste } = employe;

// Pareil pour les tableaux (l'ordre compte) :
const [premier, deuxieme] = ['a', 'b', 'c'];   // premier='a', deuxieme='b'
```

Usage permanent dans le projet :

```js
// Un hook renvoie un objet -> on déballe ce dont on a besoin :
const { loading, error, reload } = useAsyncLoad(...);

// useState renvoie un tableau [valeur, fonctionDeModification] :
const [month, setMonth] = useState('');

// Les props d'un composant sont déballées directement dans la signature :
export default function PaymentStatusBadge({ status }) { ... }
```

## 3. Spread `...` (étalement)

Copie le contenu d'un objet/tableau dans un autre :

```js
const filtres = { job: 'all', gender: 'all' };

// Copie de l'objet en changeant UNE propriété (l'original n'est pas modifié) :
const nouveaux = { ...filtres, job: 'Vente' };   // { job: 'Vente', gender: 'all' }

// Fusion de tableaux :
const tous = [...tableau1, ...tableau2];
```

Exemple réel — mettre à jour un filtre sans toucher aux autres :

```js
// components/EmployeeFilterCard.jsx
onChange({ ...filters, [field]: value });
// [field] entre crochets = "clé calculée" : si field vaut 'job',
// c'est la propriété job qui est remplacée.
```

## 4. Template literals (backticks)

```js
const nom = 'Rakotobe';
const message = `Bonjour ${nom} !`;        // insère la variable dans le texte
const url = `/users/${id}/photos`;          // très courant pour les URLs
```

## 5. `?.` et `||` et `??` (valeurs manquantes)

```js
// ?. = "si ce qui précède est null/undefined, arrête-toi et renvoie undefined"
response.data?.content        // pas d'erreur même si data est undefined

// || = "si la valeur de gauche est vide/fausse, prends celle de droite"
const label = emp.job || 'Non spécifié';

// ?? = pareil mais SEULEMENT pour null/undefined (0 et '' sont gardés)
const count = valeur ?? 0;
```

## 6. Ternaire `condition ? a : b`

```js
// "si ... alors ... sinon ..." en une expression :
const couleur = reste > 0 ? 'red' : 'green';
```

C'est LE moyen d'afficher conditionnellement en JSX (voir doc React §5).

## 7. `async` / `await` (code asynchrone)

Un appel réseau prend du temps. `await` = "attends le résultat avant de continuer".

```js
// Une fonction qui utilise await doit être marquée async :
const chargerDonnees = async () => {
  const employes = await listRealEmployees();   // attend la réponse de Dolibarr
  setEmployees(employes);                        // puis continue
};
```

Gestion d'erreur avec `try/catch` :

```js
try {
  await createPeriodSalary({ ... });
  notifySuccess('Créé !');
} catch (err) {
  notifyError('Échec', err);       // exécuté si l'appel a échoué
}
```

Lancer plusieurs appels EN MÊME TEMPS (plus rapide qu'à la suite) :

```js
const [empData, salData] = await Promise.all([listRealEmployees(), listSalaries()]);
```

## 8. `.map` / `.filter` / `.find` / `.reduce` (tableaux)

```js
const nombres = [1, 2, 3, 4];

nombres.map((n) => n * 2)        // transforme chaque élément -> [2, 4, 6, 8]
nombres.filter((n) => n > 2)     // garde ceux qui passent le test -> [3, 4]
nombres.find((n) => n > 2)       // le PREMIER qui passe le test -> 3
nombres.reduce((somme, n) => somme + n, 0)  // accumule -> 10 (0 = départ)
```

Exemples réels :

```js
// Trouver l'employé sélectionné :
const selectedEmployee = employees.find((e) => String(e.id) === selectedEmployeeId);

// Garder les salaires d'UN employé :
const employeeSalaries = salaries.filter((s) => String(s.fk_user) === selectedEmployeeId);

// utils/payments.js — additionner les paiements :
export function totalPaid(payments = []) {
  return payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
}
```

⚠️ `String(e.id) === selectedEmployeeId` : Dolibarr renvoie parfois des nombres,
parfois des chaînes. On convertit avant de comparer pour éviter `5 !== "5"`.

## 9. `import` / `export`

```js
// Export nommé (plusieurs par fichier) :
export function totalPaid(...) {}
export function remainingDue(...) {}
// -> s'importe AVEC accolades, noms exacts :
import { totalPaid, remainingDue } from '../utils/payments';

// Export par défaut (un seul par fichier — nos composants de page) :
export default function SalaryCreate() {}
// -> s'importe SANS accolades, nom libre :
import SalaryCreate from './pages/frontoffice/SalaryCreate';
```

## 10. Paramètres par défaut et objet en paramètre

```js
// Valeur par défaut si l'argument n'est pas fourni :
export function listEmployees(params = {}) { ... }

// Passer un objet = "arguments nommés", plus lisible qu'une liste de valeurs :
createPeriodSalary({ userId: emp.id, startIso, endIso, amount });
// PS : `startIso` tout seul = raccourci de `startIso: startIso`
```
