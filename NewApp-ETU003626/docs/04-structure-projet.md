# Structure du projet — qui fait quoi

## Vue d'ensemble

```
NewApp-ETU003626/
├── frontend/   React + Vite + Mantine  → l'interface (port 5173)
├── backend/    Node + Express          → reset, import, jours fériés (port 4000)
└── docs/       cette documentation
```

Le frontend parle **directement** à Dolibarr (API REST) pour tout ce qui est
salariés / salaires / paiements. Il ne passe par le backend que pour :
la vérification du code backoffice, le reset, l'import, et les jours fériés (SQLite).

## La règle d'or : quel fichier pour quelle modif ?

| Je veux modifier... | Je vais dans... |
|---|---|
| L'apparence / le contenu d'une page | `frontend/src/pages/...` |
| Un calcul (reste à payer, jours fériés, filtres...) | `frontend/src/utils/...` |
| Un appel à Dolibarr (format des données envoyées) | `frontend/src/services/...` |
| Un élément d'interface réutilisé (badge, modale...) | `frontend/src/components/...` |
| Reset / Import / Jours fériés côté serveur | `backend/src/...` (voir [07-backend.md](07-backend.md)) |

## frontend/src en détail

```
src/
├── main.jsx          Point d'entrée : monte React + Mantine + AuthProvider
├── App.jsx           LES ROUTES : quelle URL affiche quelle page
│
├── pages/            Une page = un fichier. C'est ici qu'on passe 90% du temps.
│   ├── frontoffice/  EmployeeList, SalaryCreate, SalaryBatchCreate,
│   │                 SalaryPerDayBatchCreate, EmployeeDetailList, EmployeeDetail
│   └── backoffice/   Dashboard, Holidays, ImportData, ResetData (protégées par code)
│
├── services/         LES APPELS RÉSEAU. Une page n'appelle jamais axios directement.
│   ├── employeeService.js   listRealEmployees()...          → Dolibarr
│   ├── salaryService.js     createPeriodSalary, addPayment  → Dolibarr
│   │                        ⚠️ le format EXACT des payloads Dolibarr vit ICI
│   ├── dashboardService.js  agrégats par genre / par mois
│   ├── holidayService.js    CRUD jours fériés               → backend
│   ├── adminService.js      reset + import                  → backend
│   └── authService.js       vérification du code            → backend
│
├── utils/            FONCTIONS PURES (pas de React) : faciles à lire et modifier.
│   ├── payments.js          totalPaid, remainingDue, paymentStatus
│   ├── salaryCalc.js        règle "tarif journalier + fériés x2"
│   ├── employeeFilters.js   filterEmployees(employees, criteres)
│   ├── dates.js             toJsDate, todayIso (timestamps Dolibarr → Date JS)
│   ├── format.js            formatAmount (€ FR), formatDate
│   └── notify.js            notifySuccess / notifyWarning / notifyError
│
├── hooks/
│   └── useAsyncLoad.js      LE pattern de chargement de toutes les pages
│
├── components/       Morceaux d'interface réutilisés par plusieurs pages :
│                     FrontofficeLayout, BackofficeLayout, SideNavShell,
│                     PageStates (LoadingScreen/PageError), ConfirmModal,
│                     PaymentStatusBadge, EmployeeAvatar, EmployeeFilterCard,
│                     EmployeeSelectionTable, GenerationReportModal
│
├── api/              Les 2 clients axios (bas niveau, on n'y touche presque jamais)
│   ├── dolibarr.js   → API Dolibarr (clé DOLAPIKEY automatique)
│   └── backend.js    → backend NewApp (code backoffice automatique)
│
├── auth/             CodeGate (garde des routes /admin) + stockage du code
└── context/          AuthContext (fournit isUnlocked/unlock/lock) + useAuth
```

## Le trajet d'une donnée (exemple : créer un salaire)

```
SalaryCreate.jsx                    la page appelle
  └→ createPeriodSalary(...)        services/salaryService.js construit le payload
       └→ dolibarr.post(...)        api/dolibarr.js ajoute l'URL + la clé API
            └→ Dolibarr             enregistre en base MySQL
```

Puis la page appelle `reload()` pour recharger les données affichées.

**Pourquoi cette séparation ?** Si Dolibarr change de format demain, tu ne
modifies QUE le service. Si tu veux changer l'apparence, tu ne touches QUE la
page — impossible de casser le format des données en modifiant un tableau HTML.

## Configuration (.env)

| Fichier | Contient |
|---|---|
| `frontend/.env` | URL Dolibarr, clé API, URL backend, code par défaut |
| `backend/.env` | port, code backoffice, accès MySQL Dolibarr, chemin SQLite |

⚠️ Vite n'applique un changement de `.env` qu'au redémarrage de `npm run dev`,
et les variables doivent commencer par `VITE_` pour être visibles côté frontend.
