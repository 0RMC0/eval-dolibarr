import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 4000,
  backofficeCode: process.env.BACKOFFICE_CODE || 'changeme',
  dolibarr: {
    url: process.env.DOLIBARR_URL || 'http://localhost/dolibarr/api/index.php',
    apiKey: process.env.DOLIBARR_API_KEY || '',
    // Type de paiement de salaire (dictionnaire c_paiement, ex. 4 = CHQ, 2 = LIQ).
    // Le module Banque n'est pas actif : aucun compte bancaire n'est requis.
    paymentTypeId: Number(process.env.DOLIBARR_PAYMENT_TYPE_ID) || 4,
  },
  sqlitePath: process.env.SQLITE_PATH || './data/newapp.db',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  // Base MySQL de Dolibarr (accès direct pour la réinitialisation [J1 - 1.b]).
  mysql: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'dolibarr',
    prefix: process.env.DB_PREFIX || 'llx_',
  },
};
