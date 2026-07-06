import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requireBackofficeCode } from './middleware/auth.js';
import authRoutes from './routes/auth.routes.js';
import resetRoutes from './routes/reset.routes.js';
import importRoutes from './routes/import.routes.js';
import holidayRoutes from './routes/holiday.routes.js';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Santé du service (non protégé)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'newapp-backend' });
});

// Toutes les routes métier du backend sont protégées par le code backoffice
app.use('/api/auth', requireBackofficeCode, authRoutes);
app.use('/api/reset', requireBackofficeCode, resetRoutes);
app.use('/api/import', requireBackofficeCode, importRoutes);
app.use('/api/holidays', requireBackofficeCode, holidayRoutes);

// Gestion centralisée des erreurs
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur.' });
});

app.listen(config.port, () => {
  console.log(`NewApp backend en écoute sur http://localhost:${config.port}`);
});
