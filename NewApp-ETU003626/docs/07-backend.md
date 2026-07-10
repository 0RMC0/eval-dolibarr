# Le backend Express — structure et modification

Le backend ne sert que ce qui ne peut pas passer en direct frontend→Dolibarr :
vérification du code backoffice, **reset** (MySQL direct), **import** (CSV/ZIP),
**jours fériés** (SQLite).

## Les couches (toujours le même trajet)

```
requête HTTP
  └→ server.js            monte la route + le middleware de protection
      └→ routes/           fait juste le lien URL → controller
          └→ controllers/  lit la requête, appelle le service, renvoie le JSON
              └→ services/ la logique métier
                  └→ dao/  les requêtes SQL (MySQL Dolibarr ou SQLite)
                  └→ dolibarr.service.js  les appels à l'API Dolibarr
```

Exemple complet avec les jours fériés :

```js
// server.js
app.use('/api/holidays', requireBackofficeCode, holidayRoutes);

// routes/holiday.routes.js — le lien URL → fonction
router.get('/', listHolidays);
router.post('/', createHoliday);

// controllers/holiday.controller.js — req/res, rien d'autre
export async function createHoliday(req, res, next) {
  try {
    res.status(201).json(holidayDao.insert(req.body));
  } catch (err) {
    next(err);   // → le middleware d'erreur central renvoie un JSON propre
  }
}

// dao/holiday.dao.js — le SQL
insert(holiday) {
  return getDb().prepare('INSERT INTO holidays ...').run(...);
}
```

## Ajouter un endpoint : la checklist

1. **Controller** — `controllers/xxx.controller.js` : une fonction par action,
   signature `(req, res, next)`. Données reçues : `req.body` (JSON envoyé),
   `req.params.id` (dans l'URL), `req.query` (après le `?`). Toujours le
   `try { ... } catch (err) { next(err); }`.
2. **Route** — `routes/xxx.routes.js` : `router.get/post/put/delete`.
3. **Montage** — `server.js` : `app.use('/api/xxx', requireBackofficeCode, xxxRoutes);`
   → enlève `requireBackofficeCode` seulement si l'endpoint doit être public.
4. **Frontend** — la fonction d'appel dans un service (client `backend` de
   `api/backend.js`, qui envoie le code backoffice automatiquement).

## Les deux bases de données

**MySQL (la base de Dolibarr)** — `db/mysql.js`, utilisée par le reset :

```js
import { getPool, prefix } from '../db/mysql.js';
const [rows] = await getPool().query(`SELECT rowid FROM ${prefix}user WHERE ...`);
```

⚠️ On n'écrit dedans que pour le reset. Toute création de données passe par
l'API Dolibarr (sinon Dolibarr ne déclenche pas sa propre logique).

**SQLite (la base locale NewApp)** — `db/sqlite.js`, données propres à NewApp
(jours fériés). Synchrone, pas de `await` :

```js
import { getDb } from '../db/sqlite.js';
const rows = getDb().prepare('SELECT * FROM holidays ORDER BY date').all();
getDb().prepare('INSERT INTO holidays (date, label) VALUES (?, ?)').run(date, label);
```

`?` = paramètres échappés automatiquement (ne JAMAIS concaténer une valeur
dans la chaîne SQL). Nouvelle table → l'ajouter dans le `CREATE TABLE IF NOT
EXISTS` de `db/sqlite.js`.

## Parler à Dolibarr depuis le backend

Tout passe par `services/dolibarr.service.js` :

```js
import { dolibarr } from './dolibarr.service.js';
const users = await dolibarr.get('/users?limit=100');
await dolibarr.post('/salaries', { fk_user: 5, label: '...', amount: 900 });
```

Les fonctions métier (créer un user, un salaire, une photo…) sont déjà dans ce
fichier — regarde-les avant d'en écrire une nouvelle.

## Config et lancement

- Config : `backend/.env` (copié depuis `.env.example`), lu par `config/index.js`.
  Jamais de `process.env` ailleurs que dans ce fichier.
- Lancement : `cd backend && npm run dev` (redémarre seul à chaque sauvegarde).
- Vérifier qu'un fichier compile : `node --check src/chemin/fichier.js`
- Santé du serveur : `http://localhost:4000/api/health`

## Pièges connus

- **Vieux serveur fantôme** : si le backend répond bizarrement (404 sur une
  route qui existe), un ancien processus node occupe peut-être le port 4000.
  PowerShell : `Get-Process node | Stop-Process -Force` — ⚠️ ça tue AUSSI le
  serveur Vite du frontend, relance les deux.
- Le middleware `requireBackofficeCode` lit l'en-tête `x-backoffice-code` :
  côté frontend c'est `api/backend.js` qui l'ajoute automatiquement.
