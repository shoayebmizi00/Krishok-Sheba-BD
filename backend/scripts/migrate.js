import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { getDatabaseConfig } from '../config/databaseConfig.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.resolve(__dirname, '..', 'database', 'migrations');

const connection = await mysql.createConnection({
  ...getDatabaseConfig(),
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
