# Documentation NewApp

Documentation pour modifier le code sans rien casser, pensée pour un niveau
intermédiaire en React.

## Ordre de lecture conseillé

| Fichier | Contenu | Quand le lire |
|---|---|---|
| [01-syntaxe-javascript.md](01-syntaxe-javascript.md) | La syntaxe JS moderne utilisée partout (`=>`, `...`, destructuring, `async/await`, `.map`) | Si une ligne de code te paraît illisible |
| [02-syntaxe-react.md](02-syntaxe-react.md) | JSX, composants, props, `useState`, `useEffect`, listes, formulaires | **À lire en premier** |
| [03-syntaxe-mantine.md](03-syntaxe-mantine.md) | Les composants d'interface (Stack, Card, Table, Modal…) et leurs props | Quand tu modifies l'apparence |
| [04-structure-projet.md](04-structure-projet.md) | Qui fait quoi : pages, services, utils, hooks, composants | **À lire en deuxième** |
| [05-recettes-modification.md](05-recettes-modification.md) | Pas-à-pas : ajouter une page, un champ, un appel API, un filtre… | Quand tu veux modifier quelque chose |
| [06-patterns-du-projet.md](06-patterns-du-projet.md) | Les 5 patterns récurrents du projet, expliqués lentement | Quand tu croises du code "bizarre" |
| [07-backend.md](07-backend.md) | Le backend Express : couches, ajouter un endpoint, SQLite | Quand tu touches au backend |

## Réflexe à garder

Après **chaque** modification frontend :

```bash
cd frontend && npm run build
```

Si ça compile, tu n'as pas cassé d'import ni de syntaxe. Pour vérifier plus finement :

```bash
npx eslint src
```
