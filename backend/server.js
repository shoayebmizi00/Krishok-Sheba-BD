import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { checkDatabaseConnection } from './config/db.js';
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
const allowedOrigins = (process.env.FRONTEND_URL
  || (process.env.NODE_ENV === 'production'
    ? 'https://krishok-sheba-bd.vercel.app'
    : 'http://localhost:5173'))
  .split(',')
  .map((item) => item.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
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
    res.json({
      status: 'ok',
      database: 'connected',
      ssl: database.ssl,
      sslCipher: database.sslCipher
    });
  } catch (error) {
    next(error);
  }
});

app.get('/', (_req, res) => {
  res.json({
    name: 'KRISHOK-SHEBA BD API',
    status: 'running',
    health: '/api/health'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes);

for (const [name, config] of Object.entries(resources)) {
  const controller = createResourceController(models[name], config);
  app.use(`/api/${config.route}`, createResourceRouter(controller, config));
}

app.use((_req, res) => res.status(404).json({ message: 'API route not found' }));

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ message: 'A referenced record does not exist' });
  }
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'A record with this value already exists' });
  }
  if (error.name === 'MulterError' || error.message?.startsWith('Only ')) {
    return res.status(400).json({ message: error.message });
  }
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

app.listen(port, async () => {
  console.log(`KRISHOK-SHEBA BD API running at http://localhost:${port}`);
  try {
    await checkDatabaseConnection();
    console.log('MySQL connection established');
  } catch (error) {
    console.error(`MySQL connection failed: ${error.message}`);
  }
});
