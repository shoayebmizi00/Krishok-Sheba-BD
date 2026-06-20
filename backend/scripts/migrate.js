import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.resolve(__dirname, '..', 'database', 'migrations');
const sslEnabled = String(process.env.DB_HOST || '').endsWith('.aivencloud.com')
  || ['true', '1', 'required'].includes(String(process.env.DB_SSL || '').toLowerCase());

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslEnabled
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' }
    : undefined,
  multipleStatements: true
});

try {
  const files = (await fs.readdir(migrationsDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsDirectory, file), 'utf8');
    await connection.query(sql);
    console.log(`Applied database migration: ${file}`);
  }
} finally {
  await connection.end();
}
