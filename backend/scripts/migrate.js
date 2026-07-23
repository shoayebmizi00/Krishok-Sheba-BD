import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { pool } from '../config/db.js';

dotenv.config();

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationDirectory = path.resolve(scriptDirectory, '../../database/postgresql');
console.log('[migration] PostgreSQL connection opening');
const connection = await pool.getConnection();

try {
  console.log('[migration] PostgreSQL connection established');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = (await fs.readdir(migrationDirectory))
    .filter((file) => /^\d+.*\.sql$/i.test(file))
    .sort((left, right) => left.localeCompare(right));

  for (const filename of files) {
    const [applied] = await connection.execute(
      'SELECT filename FROM schema_migrations WHERE filename = $1',
      [filename]
    );
    if (applied.length) {
      console.log(`[migration] Already applied: ${filename}`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationDirectory, filename), 'utf8');
    await connection.beginTransaction();
    try {
      await connection.execute(sql);
      await connection.execute(
        'INSERT INTO schema_migrations (filename) VALUES ($1) RETURNING filename',
        [filename]
      );
      await connection.commit();
      console.log(`[migration] Applied: ${filename}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }
  console.log('[migration] PostgreSQL migrations complete');
} finally {
  connection.release();
  await pool.end();
}
