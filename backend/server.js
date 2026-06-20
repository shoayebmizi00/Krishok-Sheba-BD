import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { checkDatabaseConnection, checkDatabaseSchema } from './config/db.js';
import { resources } from './config/resources.js';
import { models } from './models/index.js';
import { createResourceController } from './controllers/resourceController.js';
import { createResourceRouter } from './routes/resourceRoutes.js';
import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required. Copy backend/.env.example to backend/.env and configure it.');
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT || 5000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deployment = process.env.RENDER_GIT_COMMIT?.slice(0, 7) || process.env.npm_package_version || 'development';
const defaultOrigins = [
  'http://localhost:5173',
  'https://krishok-sheba-bd.vercel.app'
];
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((item) => item.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);

app.disable('x-powered-by');
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});
app.use(cors({
  origin(origin, callback) {
    const normalizedOrigin = origin?.replace(/\/$/, '');
    const isVercelPreview = /^https:\/\/krishok-sheba-bd(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(
      normalizedOrigin || ''
    );

    if (!origin || allowedOrigins.has(normalizedOrigin) || isVercelPreview) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: false
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0
}));

app.get('/api/health', async (_req, res, next) => {
  try {
    const database = await checkDatabaseConnection();
    const schema = await checkDatabaseSchema();
    if (!schema.ready) {
      return res.status(503).json({
        status: 'error',
        database: 'schema_incomplete',
        missingTables: schema.missingTables,
        deployment
      });
    }
    res.json({
      status: 'ok',
      database: 'connected',
      ssl: database.ssl,
      sslCipher: database.sslCipher,
      tables: schema.tableCount,
      deployment
    });
  } catch (error) {
    next(error);
  }
});

app.get('/', (_req, res) => {
  res.json({
    name: 'KRISHOK-SHEBA BD API',
    status: 'running',
    health: '/api/health',
    deployment
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes);

for (const [name, config] of Object.entries(resources)) {
  const controller = createResourceController(models[name], config);
  app.use(`/api/${config.route}`, createResourceRouter(controller, config));
}

app.use((_req, res) => res.status(404).json({ message: 'API route not found' }));

app.use((error, req, res, _next) => {
  console.error('[api.error]', {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    message: error.message,
    stack: error.stack
  });
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ message: 'A referenced record does not exist' });
  }
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'A record with this value already exists' });
  }
  if (['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'HANDSHAKE_SSL_ERROR'].includes(error.code)) {
    return res.status(503).json({ message: 'Database is temporarily unavailable. Please try again shortly.' });
  }
  if (error.name === 'MulterError' || error.message?.startsWith('Only ')) {
    return res.status(400).json({ message: error.message });
  }
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

app.listen(port, '0.0.0.0', async () => {
  console.log(`KRISHOK-SHEBA BD API running on 0.0.0.0:${port} (${deployment})`);
  try {
    await checkDatabaseConnection();
    console.log('MySQL connection established');
  } catch (error) {
    console.error(`MySQL connection failed: ${error.message}`);
  }
});
