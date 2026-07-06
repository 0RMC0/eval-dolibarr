# HANDOFF — Projet Eval Info 3 (NewApp × Dolibarr)

Document de reprise pour toute IA/développeur rejoignant le projet. Lis-le en entier
avant d'agir. Dernière mise à jour : 2026-07-06.

> ⚠️ Le dossier applicatif a été renommé **`NewApp` → `NewApp-ETU003626`** (n° étudiant).
> Partout où ce document écrit `NewApp/…`, lire `NewApp-ETU003626/…`.

---

## 1. Vue d'ensemble

Application **NewApp** (React + Node) connectée à une instance **Dolibarr v23** existante
(`existingApp`) via son API REST. Contexte : projet scolaire (ITU), gestion de salariés
et de salaires basée sur le module **Salaire** de Dolibarr.

**Règle d'architecture clé (imposée par le client) :**
- Tout ce qui peut passer **directement** frontend → Dolibarr passe en direct (API REST).
- Tout ce qui touche **SQLite** et la **réinitialisation de données** passe par le **backend** NewApp.

```
┌────────────┐   API REST directe    ┌──────────────────┐
│  Frontend  │ ───────────────────▶  │  Dolibarr v23    │
│  (React)   │                       │  (existingApp)   │
└─────┬──────┘                       │  MySQL: dolibarr │
      │ reset / import / SQLite      └────────▲─────────┘
      ▼                                       │ MySQL direct + API REST
┌────────────┐                                │
│  Backend   │ ───────────────────────────────┘
│ (Express)  │  + SQLite locale (à partir du J2)
└────────────┘
```

---

## 2. Emplacements & stack

| Élément | Emplacement / techno |
|---|---|
| Racine projet | `D:\ITU\Eval Info 3` |
| NewApp frontend | `NewApp/frontend` — React 19, Vite 8, **Mantine** (UI + charts), react-router-dom, axios |
| NewApp backend | `NewApp/backend` — Node (ESM), Express 5, better-sqlite3, mysql2, multer, csv-parse, yauzl |
| Dolibarr (install) | `C:\xampp\htdocs\dolibarr\htdocs` (XAMPP) |
| Dolibarr data root | `C:\xampp\htdocs\dolibarr\documents` |
| Dolibarr source zip | `D:\ITU\Eval Info 3\dolibarr-23.0.3.zip` (pour lire les contrats d'API) |
| Données à importer | `D:\ITU\Eval Info 3\Donnee` (2 CSV + `images/` + `images.zip`) |

**Ports :** frontend `5173`, backend `4000`, Dolibarr web `http://localhost:800/dolibarr/htdocs`.

---

## 3. Identifiants & configuration (non secrets — contexte éval local)

Fichiers `.env` réels présents dans `NewApp/backend/.env` et `NewApp/frontend/.env`
(gitignorés ; des `.env.example` documentent chaque variable).

**Dolibarr API :**
- URL : `http://localhost:800/dolibarr/htdocs/api/index.php`
- Clé API (DOLAPIKEY) : `680f85f917734f5564a0839861ecce2169715d35` — appartient à l'utilisateur **admin (rowid=1)**.
- Explorer : `.../api/index.php/explorer`

**MySQL Dolibarr :** host `127.0.0.1:3306`, user `root`, password **vide**, base `dolibarr`, préfixe tables `llx_`.

**Backoffice NewApp :** code unique global `changeme` (`BACKOFFICE_CODE` backend = `VITE_BACKOFFICE_CODE` frontend). Pas de login, code pré-rempli sur le formulaire, gardé en `sessionStorage`.

**Paiements de salaire :** `DOLIBARR_PAYMENT_TYPE_ID=2` (LIQ/espèces). **Module Banque NON actif** → aucun `accountid`/compte bancaire requis.

---

## 4. Structure du code

```
NewApp-ETU003626/
├── frontend/src/
│   ├── api/            dolibarr.js (client direct)  ·  backend.js (client + header code)
│   ├── auth/           CodeGate.jsx (garde de route)  ·  backofficeCode.js (storage)
│   ├── context/        AuthContext.jsx (useAuth)
│   ├── components/     BackofficeLayout.jsx · FrontofficeLayout.jsx · EmployeeAvatar.jsx
│   ├── services/       employeeService, salaryService, dashboardService, adminService,
│   │                   authService, holidayService
│   ├── utils/          format.js (montant FR/dates)  ·  payments.js (total payé / reste dû)
│   └── pages/
│       ├── frontoffice/  EmployeeList, SalaryCreate, SalaryBatchCreate,
│       │                 EmployeeDetailList, EmployeeDetail
│       └── backoffice/   Dashboard, Holidays, ImportData, ResetData
└── backend/src/
    ├── config/index.js         config centralisée (lit .env)
    ├── server.js               Express, CORS, routes protégées, middleware d'erreur
    ├── middleware/auth.js       vérifie header x-backoffice-code
    ├── routes/                 auth, reset, import, holiday (minces → controllers)
    ├── controllers/            reset, import, holiday
    ├── services/               reset.service, import.service, dolibarr.service (client + fonctions métier)
    ├── dao/                    reset.dao (MySQL+SQLite)  ·  employee.dao (stub)  ·  holiday.dao (SQLite)
    ├── db/                     mysql.js (pool Dolibarr)  ·  sqlite.js (better-sqlite3 : table holidays)
    └── utils/                  csv.js, payment-parser.js, date.js, zip.js
```
> `salary.dao.js` a été **supprimé** (aucune donnée salaire en SQLite). La seule table
> SQLite est `holidays` (J2).

Flux backend : **route → controller → service → dao/dolibarr.service**. Erreurs centralisées.

---

## 5. Contrats Dolibarr découverts (IMPORTANT)

### Employé = utilisateur Dolibarr (`llx_user`, `POST /users`, obligatoire: `login`)
| CSV (Feuille 1) | Champ Dolibarr |
|---|---|
| `identifiant` | `login` |
| `mdp` | `pass` |
| `nom` | `lastname` |
| `genre` (homme/femme) | `gender` (**man/woman**) |
| `poste` | `job` |
| `heure_travail_semaine` | `weeklyhours` |
| `ref_employe` | `ref_employee` |
| — | `employee` = 1 |

### Salaire (`llx_salary`, `POST /salaries`, obligatoires: `fk_user`, `label`, `amount`)
| CSV (Feuille 2) | Champ Dolibarr |
|---|---|
| `ref_employe` → id user | `fk_user` |
| `montant` (`"677,56"` FR) | `amount` (677.56) |
| `date_debut` | `datesp` (date début période, ISO `aaaa-mm-jj`) |
| `date_fin` | `dateep` (date fin période) |

> **1.d.II** (salaire par mois) utilise `datesp` (= date début) comme référence.

### Paiement (`POST /salaries/{id}/payments`, `llx_payment_salary`)
Champs à envoyer : `paiementtype` (validation), `fk_typepayment` (réellement utilisé),
`chid` (=id salaire, validation), `datepaye` (ISO), `amounts` = **`{ [idSalaire]: montant }`**
(la clé est l'id du salaire !). `accountid` **inutile** (module Banque off).
Colonne `paiement` du CSV = liste de paiements → **paiement en plusieurs fois** (cf. 2.b).
Format source non-standard : `{["08/03/26",480],["08/03/26",300]}` — parseur tolérant dans `payment-parser.js`.

### Photo employé (piège connu ⚠️)
Fichiers dans `documents/users/{id}/photos/`. La colonne `llx_user.photo` = nom de fichier.
**La fiche affiche la VIGNETTE** `photos/thumbs/{base}_small.png` (et `_mini`). Si la vignette
manque → avatar par défaut, **sans fallback vers l'original**. L'API REST ne génère PAS les
thumbs pour un user (paramètre `generateThumbs` inopérant via `subdir`). Solution appliquée :
`setUserPhoto` dépose original + `_small` + `_mini` (mêmes octets, images = petites icônes).
Nom de fichier image = `ref_employe` (`1.png` → employé réf 1).

---

## 6. État des tâches

### J0 / préparation — FAIT
- Arborescence NewApp scindée frontend/backend, Mantine, couches backend, clients API.

### J1
| # | Tâche | État |
|---|---|---|
| 1.a | Protection backoffice par code unique (garde route, vérif backend, Verrouiller) | ✅ **FAIT & vérifié** |
| 1.b | Réinitialisation données (MySQL direct + SQLite + fichiers photo via API) | ✅ **FAIT & vérifié** (endpoint 200, schéma validé) |
| 1.c | Import 2 CSV + ZIP photos → Dolibarr | ✅ **FAIT & exécuté** (3 employés/salaires/paiements/photos importés) |
| 1.d | Dashboard : salaire par genre + par mois (charts Mantine) | ✅ **FAIT & vérifié** (KPIs + DonutChart + BarChart implémentés) |
| 2.a | Liste des salariés + **recherche multi-critères** | ✅ **FAIT & vérifié** (cartes + recherche + filtres genre/poste) |
| 2.b | Créer + payer un salaire (**paiement en plusieurs fois**) | ✅ **FAIT & vérifié** (attribution + modale paiements multiples) |
| D.1 | Données importées visibles dans Dolibarr | ✅ vérifié (users/salaires/photos OK) |
| D.2 | Modifs dans Dolibarr impactent NewApp (via API) | ✅ **Vérifié** (les données sont lues en direct par l'API Dolibarr) |

### J2
| # | Tâche | État |
|---|---|---|
| 1.a | Importer la colonne poste du fichier (déjà fait) | ✅ **FAIT** |
| 1.b | Ajouter une table jour férié dans SQLite | ✅ **FAIT & vérifié** (table `holidays` créée) |
| 1.b.I | Créer un CRUD pour les jours fériés (Backend REST + Front CRUD) | ✅ **FAIT & vérifié** (routes REST + interface d'administration) |
| 2.a | Page générer le salaire de plusieurs salariés (avec filtres poste/genre/heures) | ✅ **FAIT & vérifié** (génération par lot dans le Frontoffice) |
| 2.b | Page liste salariés sans filtre + Fiche détaillée (salarié, historique salaires/paiements, reste à payer) | ✅ **FAIT & vérifié** (page de détails historique avec vue master-detail) |

**Prochaine étape recommandée : Le projet J1 et J2 est entièrement finalisé et prêt pour la revue / évaluation.**

---

## 6bis. Dernières modifications (session en cours)

- **Import fichier par fichier** : les 3 fichiers ne sont plus obligatoires ensemble. On peut
  importer employés / salaires / photos **indépendamment**. Pour rattacher des salaires ou
  photos importés seuls, `import.service.js` pré-charge les utilisateurs existants via
  `GET /users?limit=1000` et mappe `ref_employee → id`.
  *(Fix appliqué : le client bas niveau `dolibarr` n'était pas importé dans `import.service.js`,
  ce qui cassait silencieusement l'import séparé — corrigé.)*
- **Reset — suppression des fichiers photo** : le reset supprime désormais aussi les fichiers
  photo (original + vignettes) des employés supprimés, **via l'API Dolibarr** (`DELETE /documents`,
  fonction `deleteUserPhotoFiles` dans `dolibarr.service.js`) et **non** par le système de
  fichiers → compatible **Dolibarr sur un autre serveur**. Ordre sûr : commit MySQL d'abord,
  fichiers ensuite. Le rapport de reset expose un compteur `fichiers`.
  - ⚠️ **À vérifier** : lors d'un test, `fichiers` est revenu à `0` alors que des photos
    existaient. Cause probable à investiguer : soit le format des paramètres de `DELETE /documents`
    (query vs body sous Restler), soit l'accès refusé car la ligne user est déjà supprimée.
    À confirmer avant de considérer le nettoyage fichiers comme pleinement fiable.
  - Limite : ne rattrape pas les **orphelins** d'anciens cycles. Vérifié dans les sources :
    `User::delete()` de Dolibarr ne supprime pas le dossier `documents/users/{id}` non plus.
- **`salary.dao.js` supprimé** (aucune donnée salaire en SQLite).
- **UI** : `Layout.jsx` scindé en `BackofficeLayout.jsx` + `FrontofficeLayout.jsx` ; ajout de
  `EmployeeAvatar.jsx`.
- **Dossier renommé** : `NewApp` → `NewApp-ETU003626`.

---

## 7. Démarrage

```bash
# Backend (port 4000)
cd "NewApp-ETU003626/backend" && npm install && npm run dev

# Frontend (port 5173)
cd "NewApp-ETU003626/frontend" && npm install && npm run dev
```
Backoffice : `http://localhost:5173/admin` → code `changeme`.

---

## 8. Pièges & conventions (à connaître avant de coder)

- **Processus node périmés** : d'anciens serveurs backend restent parfois sur le port 4000 et
  répondent avec l'ancienne config → 404/401 trompeurs. `Get-Process node | Stop-Process -Force`
  nettoie **mais tue aussi le serveur Vite**. Relancer les deux après.
- **`preview_click` sur un submit** ne déclenche pas toujours le `onSubmit` d'un `<form>` React ;
  utiliser `form.requestSubmit()` via `preview_eval` pour tester.
- **Le client a demandé** : réutiliser des librairies existantes ; séparer un max les fonctions
  (KISS) ; CSS via librairie (Mantine), pas d'inline.
- **La clé API Dolibarr est admin** (bypass de certains droits) mais certaines API (banque, setup)
  renvoient 403 — ne pas s'y fier pour tester la présence d'un module.
- **Reset** : ne supprime JAMAIS l'admin (`rowid=1`) ; cible les users avec `ref_employee` renseigné.
- Lire les contrats d'API dans le zip Dolibarr : `unzip -o dolibarr-23.0.3.zip "dolibarr-23.0.3/htdocs/<chemin>" -d <dest>` (ex. `salaries/class/api_salaries.class.php`).
- Ne pas committer sans demande explicite (le dépôt n'est pas un repo git à ce stade).

---

## 9. Mémo API Dolibarr utile

- `GET /users?limit=1` — test connexion.
- `GET /users/info` — utilisateur de la clé API.
- `POST /users`, `POST /salaries`, `POST /salaries/{id}/payments`.
- `GET /salaries`, `GET /salaries/payments`.
- `POST /documents/upload` — `{filename, modulepart:'user', subdir:'{id}/photos', filecontent(base64), fileencoding:'base64', overwriteifexists:1}`.
- Header d'auth : `DOLAPIKEY: <clé>`.
