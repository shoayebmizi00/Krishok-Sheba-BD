import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { getDatabaseConfig } from '../config/databaseConfig.js';

dotenv.config();

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');
const fullName = String(process.env.ADMIN_NAME || 'সুপার অ্যাডমিন').trim();
const optionalBootstrap = process.argv.includes('--if-configured');

if (!email || !email.includes('@')) {
  if (optionalBootstrap && !email && !password) {
    console.log('Admin bootstrap skipped: ADMIN_EMAIL and ADMIN_PASSWORD are not configured.');
    process.exit(0);
  }
  throw new Error('ADMIN_EMAIL পরিবেশ ভেরিয়েবলে একটি সঠিক ইমেইল দিন।');
}
if (password.length < 8) {
  throw new Error('ADMIN_PASSWORD কমপক্ষে ৮ অক্ষরের হতে হবে।');
}

const connection = await mysql.createConnection(getDatabaseConfig());

try {
  const passwordHash = await bcrypt.hash(password, 12);
  const [existing] = await connection.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  if (existing[0]) {
    await connection.execute(
      `UPDATE users
       SET password_hash = ?, full_name = ?, role = 'admin', is_active = TRUE
       WHERE id = ?`,
      [passwordHash, fullName, existing[0].id]
    );
    console.log(`Admin account updated: ${email}`);
  } else {
    await connection.execute(
      `INSERT INTO users (id, email, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, ?, 'admin', TRUE)`,
      [crypto.randomUUID(), email, passwordHash, fullName]
    );
    console.log(`Admin account created: ${email}`);
  }
} finally {
  await connection.end();
}
