// Corre antes de cada archivo de test, ANTES de importar la app: config/env.ts
// lee estas variables apenas se carga y se niega a arrancar si faltan.
import crypto from 'node:crypto';

process.env['NODE_ENV'] = 'test';
process.env['MONGODB_URI'] = 'mongodb://placeholder'; // los tests de integración usan mongodb-memory-server
process.env['CORS_ORIGINS'] = 'http://localhost:5173';

// Secretos aleatorios en cada ejecución: ningún secreto queda escrito en el código.
process.env['JWT_ACCESS_SECRET'] = crypto.randomBytes(32).toString('hex');
process.env['JWT_REFRESH_SECRET'] = crypto.randomBytes(32).toString('hex');
