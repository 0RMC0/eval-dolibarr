# NewApp

Application connectée à **Dolibarr v23** (existingApp) via son API REST.
Divisée en deux parties :

| Partie | Techno | Rôle |
|--------|--------|------|
| `frontend/` | React + Vite | Interface. Parle **directement** à Dolibarr (liste salariés, salaires, dashboard). Backoffice protégé par un code unique. |
| `backend/` | Node + Express | Réinitialisation des données, import CSV/ZIP, base **SQLite** (à partir du J2). |

## Arborescence

```
NewApp/
├── frontend/
│   └── src/
│       ├── api/          # dolibarr.js (direct) + backend.js
│       ├── auth/         # code unique backoffice (CodeGate)
│       ├── components/   # Layout
│       └── pages/
│           ├── frontoffice/   # EmployeeList, SalaryCreate
│           └── backoffice/    # Dashboard, ImportData, ResetData
└── backend/
    └── src/
        ├── routes/       # reset, import
        ├── services/     # dolibarr, import, reset
        ├── middleware/   # auth (code backoffice)
        ├── db/           # sqlite (J2)
        └── utils/        # csv, payment-parser
```

## Démarrage

```bash
# Backend
cd backend
cp .env.example .env      # renseigner DOLIBARR_URL, DOLIBARR_API_KEY, BACKOFFICE_CODE
npm install
npm run dev               # http://localhost:4000

# Frontend
cd frontend
cp .env.example .env      # renseigner VITE_DOLIBARR_URL, VITE_DOLIBARR_API_KEY, VITE_BACKEND_URL
npm install
npm run dev               # http://localhost:5173
```

## État d'avancement (J1)

- [x] Arborescence frontend + backend
- [x] 1.a Protection des pages backoffice (code vérifié par le backend, garde de route unique)
- [x] 1.b Réinitialisation des données (MySQL direct + SQLite)
- [~] 1.c Import des 2 CSV + ZIP d'images (implémenté ; pas encore exécuté sur Dolibarr réel)
- [ ] 1.d Dashboard (salaire par genre / par mois)
- [ ] 2.a Liste des salariés + recherche multi-critères
- [ ] 2.b Création + paiement échelonné d'un salaire
