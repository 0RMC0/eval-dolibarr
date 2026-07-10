# Syntaxe React (tout ce qu'il faut pour ce projet)

## 1. Un composant = une fonction qui renvoie du JSX

```jsx
export default function MaPage() {
  return (
    <div>
      <h1>Bonjour</h1>
    </div>
  );
}
```

Règles JSX à connaître :
- Le nom d'un composant commence par une **Majuscule** (`<MaPage />` vs `<div>`).
- Un composant doit renvoyer **UN SEUL** élément racine. Pour en grouper
  plusieurs sans ajouter de div : `<> ... </>` (fragment).
- `class` s'écrit `className`, `for` s'écrit `htmlFor`.
- `{ }` dans le JSX = "insérer du JavaScript ici" :

```jsx
<Text>Total : {formatAmount(total)}</Text>
<Badge color={reste > 0 ? 'red' : 'green'}>{reste}</Badge>
```

## 2. Les props (paramètres d'un composant)

Les props, c'est ce qu'on passe au composant comme des attributs HTML :

```jsx
// Utilisation :
<EmployeeAvatar userId={emp.id} photo={emp.photo} name={emp.lastname} size={40} />

// Définition (les props arrivent déballées dans la signature) :
export default function EmployeeAvatar({ userId, photo, name, size = 60 }) {
  // size = 60 -> valeur par défaut si non fournie
}
```

- Texte : `name="Rakotobe"` · JavaScript : `size={40}`, `photo={emp.photo}`
- **`children`** = ce qu'on met ENTRE les balises :

```jsx
<PageError title="Erreur">{error}</PageError>
// Dans PageError : function PageError({ title, children }) -> children === error
```

- Les props sont en **lecture seule** : un composant ne modifie jamais ses props.
  Si le parent doit réagir, il passe une fonction (`onChange`, `onClose`…).

## 3. `useState` — la mémoire d'un composant

```jsx
const [month, setMonth] = useState('');
//     ^valeur  ^fonction pour la changer   ^valeur de départ
```

**Règle n°1 : on ne modifie JAMAIS la valeur directement.** Toujours via le setter :

```jsx
month = '2026-03';        // ❌ interdit, React ne verra rien
setMonth('2026-03');      // ✅ React re-affiche le composant avec la nouvelle valeur
```

**Quand tu appelles `setX`, la fonction du composant est ré-exécutée** (re-render)
avec la nouvelle valeur. C'est comme ça que l'écran se met à jour.

Pour un état objet, on recrée l'objet avec spread :

```jsx
const [filters, setFilters] = useState({ job: 'all', gender: 'all' });
setFilters({ ...filters, job: 'Vente' });      // copie + modification
```

Pour un état calculé depuis l'ancien :

```jsx
setTick((t) => t + 1);    // forme "fonction" : reçoit l'ancienne valeur
```

## 4. `useEffect` — faire quelque chose après l'affichage

```jsx
useEffect(() => {
  // ce code s'exécute APRÈS que le composant est affiché
}, [dependances]);
```

Le 2ᵉ argument (le tableau) décide QUAND relancer :
- `[]` → une seule fois, à l'arrivée sur la page
- `[photo]` → à l'arrivée + à chaque fois que `photo` change
- rien du tout → à chaque re-render (presque toujours une erreur)

**Dans ce projet tu n'écriras presque jamais de `useEffect` toi-même** :
le chargement de données passe par le hook maison `useAsyncLoad`
(voir [06-patterns-du-projet.md](06-patterns-du-projet.md) §1).

## 5. Affichage conditionnel

```jsx
{/* "si X alors affiche" : */}
{error && <Alert color="red">{error}</Alert>}

{/* "si X alors A sinon B" : */}
{selected.length === 0 ? (
  <Alert>Aucune cible</Alert>
) : (
  <Table>...</Table>
)}

{/* Sortie anticipée en début de composant (pattern de toutes nos pages) : */}
if (loading) return <LoadingScreen />;
if (error) return <PageError title="...">{error}</PageError>;
return ( ...contenu normal... );
```

## 6. Afficher une liste : `.map` + `key`

```jsx
<Table.Tbody>
  {selected.map((emp) => (
    <Table.Tr key={emp.id}>          {/* key = identifiant UNIQUE, obligatoire */}
      <Table.Td>{emp.lastname}</Table.Td>
    </Table.Tr>
  ))}
</Table.Tbody>
```

`key` permet à React de savoir quelle ligne a changé. Utilise l'id de la donnée,
jamais l'index du tableau si la liste peut changer d'ordre.

## 7. Formulaires (champs contrôlés)

Chaque champ = un état + `value` + `onChange`. C'est TOUJOURS ce trio :

```jsx
const [amount, setAmount] = useState('');

<TextInput
  label="Montant"
  value={amount}                                      // l'état pilote l'affichage
  onChange={(e) => setAmount(e.currentTarget.value)}  // la saisie met à jour l'état
/>
```

Soumission — `onSubmit` sur le `<form>` + `e.preventDefault()` (empêche le
rechargement de la page, comportement HTML par défaut) :

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!amount) { notifyWarning('Champ requis.'); return; }
  await createPeriodSalary({ ... });
};

<form onSubmit={handleSubmit}>
  ...champs...
  <Button type="submit">Valider</Button>
</form>
```

## 8. Événements

```jsx
<Button onClick={handleClick}>OK</Button>          // référence à la fonction
<Button onClick={() => setOpen(true)}>OK</Button>  // fonction inline

// ⚠️ Piège classique :
<Button onClick={handleClick()}>   // ❌ exécute la fonction TOUT DE SUITE
<Button onClick={handleClick}>     // ✅ l'exécutera au clic
```

## 9. Faire remonter une info au parent

Un enfant ne peut pas modifier l'état du parent directement. Le parent passe
une fonction en prop, l'enfant l'appelle :

```jsx
// Parent :
const [filters, setFilters] = useState(NO_FILTERS);
<EmployeeFilterCard filters={filters} onChange={setFilters} />

// Enfant (EmployeeFilterCard) :
<Select value={filters.job} onChange={(v) => onChange({ ...filters, job: v })} />
```

C'est le sens unique de React : **les données descendent (props),
les événements remontent (fonctions)**.

## 10. Hooks : les 2 règles à ne jamais casser

1. On appelle les hooks (`useState`, `useEffect`, `useAuth`…) **uniquement au
   premier niveau** d'un composant — jamais dans un `if`, une boucle, ou après
   un `return` anticipé.
2. Uniquement dans un composant ou un autre hook (fichier `useXxx.js`).

```jsx
export default function MaPage() {
  const [x, setX] = useState(0);       // ✅ premier niveau
  if (condition) {
    const [y, setY] = useState(0);     // ❌ ERREUR : hook dans un if
  }
}
```
