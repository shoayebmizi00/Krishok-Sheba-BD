import dotenv from 'dotenv';
import { pool } from '../config/db.js';
import { configureAdmin } from '../services/adminBootstrap.js';

dotenv.config();

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');
const fullName = String(process.env.ADMIN_NAME || 'Super Admin').trim();
const optionalBootstrap = process.argv.includes('--if-configured');
const resetExistingPassword = process.argv.includes('--reset-password');

if (!email || !email.includes('@')) {
  if (optionalBootstrap && !email && !password) {
    console.log('Admin bootstrap skipped: ADMIN_EMAIL and ADMIN_PASSWORD are not configured.');
    process.exit(0);
  }
  throw new Error('ADMIN_EMAIL must contain a valid email address.');
}
if (password && password.length < 8) {
  throw new Error('ADMIN_PASSWORD must contain at least 8 characters.');
}

const connection = await pool.getConnection();
try {
  const result = await configureAdmin(connection, {
    email,
    password,
    fullName,
    resetExistingPassword
  });
  console.log(`Admin account ${result.action}: ${email}${result.passwordReset ? ' (password explicitly replaced)' : ''}`);
} finally {
  connection.release();
  await pool.end();
}
