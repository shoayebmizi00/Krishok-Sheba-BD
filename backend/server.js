import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { checkDatabaseConnection, checkDatabaseSchema, pool } from './config/db.js';
import { resources } from './config/resources.js';
import { models } from './models/index.js';
import { createResourceController } from './controllers/resourceController.js';
import { createResourceRouter } from './routes/resourceRoutes.js';
import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import { adminTransactionRouter, transactionRouter } from './routes/transactionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { equipmentBookingRouter, transportBookingRouter } from './routes/bookingRoutes.js';
import { conversationRouter, messageRouter } from './routes/messagingRoutes.js';
import { getEmailConfiguration } from './services/emailService.js';

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
app.set('trust proxy', 1);
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
        missingColumns: schema.missingColumns,
        deployment
      });
    }
    const emailConfiguration = getEmailConfiguration();
    res.json({
      status: 'ok',
      database: 'connected',
      ssl: database.ssl,
      sslCipher: database.sslCipher,
      tables: schema.tableCount,
      deployment,
      passwordRecoveryEmail: emailConfiguration.configured ? 'configured' : (emailConfiguration.invalid.length ? 'invalid_format' : 'missing')
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
app.use('/api/availability', availabilityRoutes);
app.use('/api/transactions', transactionRouter);
app.use('/api/admin/transactions', adminTransactionRouter);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/equipment-bookings', equipmentBookingRouter);
app.use('/api/transport-bookings', transportBookingRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/messages', messageRouter);

for (const [name, config] of Object.entries(resources)) {
  if (['conversations', 'messages'].includes(config.route)) continue;
  const controller = createResourceController(models[name], config);
  app.use(`/api/${config.route}`, createResourceRouter(controller, config));
}

app.use((_req, res) => res.status(404).json({ message: 'API route not found' }));

app.use((error, req, res, _next) => {
  const category = req.path === '/api/auth/register'
    ? 'auth.register'
    : req.path === '/api/auth/login'
      ? 'auth.login'
      : 'api.request';
  console.error('[api.error]', {
    category,
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    code: error.code,
    table: error.table,
    column: error.column,
    constraint: error.constraint,
    dataType: error.dataType,
    message: process.env.NODE_ENV === 'production' ? 'Request failed' : error.message
  });
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ code: 'INVALID_JSON', message: 'Request body must contain valid JSON.', requestId: req.id });
  }
  if (error.code === '23503') {
    return res.status(400).json({ code: 'REFERENCED_RECORD_NOT_FOUND', message: 'A referenced record does not exist.', requestId: req.id });
  }
  if (error.code === '23505') {
    return res.status(409).json({ code: 'CONFLICT', message: 'A record with this value already exists.', requestId: req.id });
  }
  if (['42P01', '42703', '23514', '42601', '22P02'].includes(error.code)) {
    return res.status(500).json({ code: 'DATABASE_SCHEMA_ERROR', message: 'The database schema rejected this request.', requestId: req.id });
  }
  if (['ECONNREFUSED', 'ETIMEDOUT', '08000', '08003', '08006', '57P01'].includes(error.code)) {
    return res.status(503).json({ code: 'DATABASE_UNAVAILABLE', message: 'Database is temporarily unavailable. Please try again shortly.', requestId: req.id });
  }
  if (error.name === 'MulterError' || error.message?.startsWith('Only ')) {
    return res.status(400).json({ code: 'UPLOAD_ERROR', message: error.message, requestId: req.id });
  }
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    requestId: req.id
  });
});

const server = app.listen(port, '0.0.0.0', async () => {
  console.log(`KRISHOK-SHEBA BD API running on 0.0.0.0:${port} (${deployment})`);
  console.log(`Password recovery email: ${getEmailConfiguration().configured ? 'configured' : 'SMTP configuration incomplete'}`);
  try {
    await checkDatabaseConnection();
    console.log('PostgreSQL connection established');
  } catch (error) {
    console.error(`PostgreSQL connection failed (${error.code || 'UNKNOWN'})`);
  }
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; closing HTTP and PostgreSQL connections.`);
  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();
  server.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch {
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
