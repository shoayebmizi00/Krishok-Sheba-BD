import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { getDatabaseConfig } from '../config/databaseConfig.js';
import { configureAdmin } from '../services/adminBootstrap.js';

dotenv.config();

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');
const fullName = String(process.env.ADMIN_NAME || 'সুপার অ্যাডমিন').trim();
const optionalBootstrap = process.argv.includes('--if-configured');
const resetExistingPassword = process.argv.includes('--reset-password');

if (!email || !email.includes('@')) {
  if (optionalBootstrap && !email && !password) {
    console.log('Admin bootstrap skipped: ADMIN_EMAIL and ADMIN_PASSWORD are not configured.');
    process.exit(0);
  }
  throw new Error('ADMIN_EMAIL পরিবেশ ভেরিয়েবলে একটি সঠিক ইমেইল দিন।');
}
if (password && password.length < 8) {
  throw new Error('ADMIN_PASSWORD কমপক্ষে ৮ অক্ষরের হতে হবে।');
}

const connection = await mysql.createConnection(getDatabaseConfig());

try {
  const result = await configureAdmin(connection, { email, password, fullName, resetExistingPassword });
  console.log(`Admin account ${result.action}: ${email}${result.passwordReset ? ' (password explicitly replaced)' : ''}`);
} finally {
  await connection.end();
}
