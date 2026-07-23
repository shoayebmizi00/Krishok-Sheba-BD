import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { pool } from '../config/db.js';

dotenv.config();

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(scriptDirectory, '../../database/postgresql/schema.sql');
console.log('[schema] PostgreSQL connection opening');
const connection = await pool.getConnection();

try {
  console.log('[schema] PostgreSQL connection established');
  const schema = await fs.readFile(schemaPath, 'utf8');
  await connection.beginTransaction();
  try {
    await connection.execute(schema);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }
  console.log('[schema] PostgreSQL schema initialization complete');
} finally {
  connection.release();
  await pool.end();
}
