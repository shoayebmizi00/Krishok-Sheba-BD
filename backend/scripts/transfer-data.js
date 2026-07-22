import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { pool } from '../config/db.js';

dotenv.config();

const tables = [
  'users', 'uploaded_files', 'crop_listings', 'bids', 'conversations', 'messages',
  'equipment', 'equipment_bookings', 'vehicles', 'transport_bookings', 'products',
  'orders', 'transactions', 'notifications', 'government_notices', 'market_prices',
  'stories', 'app_settings'
];
const execute = process.argv.includes('--execute');
const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
if (!sourceUrl) throw new Error('SOURCE_DATABASE_URL is required');

const parsedSourceUrl = new URL(sourceUrl);
const source = await mysql.createConnection({
  host: parsedSourceUrl.hostname,
  port: Number(parsedSourceUrl.port || 3306),
  user: decodeURIComponent(parsedSourceUrl.username),
  password: decodeURIComponent(parsedSourceUrl.password),
  database: decodeURIComponent(parsedSourceUrl.pathname.replace(/^\//, '')),
  ssl: parsedSourceUrl.hostname.endsWith('.aivencloud.com')
    ? { rejectUnauthorized: process.env.SOURCE_DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : undefined,
  decimalNumbers: true,
  dateStrings: true
});

function quoteIdentifier(identifier) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) throw new Error('Unsafe identifier');
  return `"${identifier}"`;
}

async function targetColumns(table) {
  const [rows] = await pool.execute(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name=? ORDER BY ordinal_position`,
    [table]
  );
  return rows.map((row) => row.column_name);
}

try {
  for (const table of tables) {
    const [countRows] = await source.query('SELECT COUNT(*) count FROM ??', [table]);
    const sourceCount = Number(countRows[0].count);
    console.log(`${table}: ${sourceCount} source row(s)${execute ? '' : ' (dry run)'}`);
    if (!execute || sourceCount === 0) continue;

    const columns = await targetColumns(table);
    if (!columns.length) throw new Error(`Target table is missing: ${table}`);
    const quotedColumns = columns.map(quoteIdentifier);
    const assignments = columns.filter((column) => column !== 'id')
      .map((column) => `${quoteIdentifier(column)}=EXCLUDED.${quoteIdentifier(column)}`).join(',');

    const batchSize = 200;
    for (let offset = 0; offset < sourceCount; offset += batchSize) {
      const [rows] = await source.query('SELECT ?? FROM ?? ORDER BY id LIMIT ? OFFSET ?', [columns, table, batchSize, offset]);
      const target = await pool.getConnection();
      try {
        await target.beginTransaction();
        for (const row of rows) {
          const placeholders = columns.map((_, index) => `$${index + 1}`).join(',');
          await target.execute(
            `INSERT INTO ${quoteIdentifier(table)} (${quotedColumns.join(',')}) VALUES (${placeholders})
             ON CONFLICT (id) DO UPDATE SET ${assignments}`,
            columns.map((column) => row[column])
          );
        }
        await target.commit();
      } catch (error) {
        await target.rollback();
        throw error;
      } finally {
        target.release();
      }
      console.log(`${table}: migrated ${Math.min(offset + rows.length, sourceCount)}/${sourceCount}`);
    }
  }
} finally {
  await source.end();
  await pool.end();
}
