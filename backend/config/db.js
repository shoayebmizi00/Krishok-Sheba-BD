import pg from 'pg';
import dotenv from 'dotenv';
import { getDatabaseConfig } from './databaseConfig.js';

dotenv.config();

const { Pool, types } = pg;

// Preserve the former API contract: numeric values are JSON numbers and date/time
// values stay strings instead of becoming JavaScript Date objects.
types.setTypeParser(20, (value) => Number(value));
types.setTypeParser(1700, (value) => Number(value));
types.setTypeParser(1082, (value) => value);
types.setTypeParser(1114, (value) => value);
types.setTypeParser(1184, (value) => value);

const requiredTables = [
  'users', 'uploaded_files', 'crop_listings', 'bids', 'conversations',
  'messages', 'equipment', 'equipment_bookings', 'vehicles',
  'transport_bookings', 'products', 'orders', 'transactions',
  'notifications', 'government_notices', 'market_prices', 'stories',
  'app_settings'
];

const requiredColumns = [
  ['users', 'role'],
  ['crop_listings', 'category'],
  ['crop_listings', 'images'],
  ['crop_listings', 'remaining_quantity'],
  ['crop_listings', 'sold_quantity'],
  ['conversations', 'participant_ids'],
  ['conversations', 'participant_one_id'],
  ['conversations', 'participant_two_id'],
  ['conversations', 'related_type'],
  ['messages', 'sender_id'],
  ['messages', 'receiver_id'],
  ['messages', 'message_text'],
  ['messages', 'is_read']
];

const databaseConfig = getDatabaseConfig();
const nativePool = new Pool(databaseConfig);
const SCHEMA_CACHE_MS = 5 * 60_000;
let schemaCache = null;

nativePool.on('error', (error) => {
  console.error(`Unexpected PostgreSQL pool error: ${error.message}`);
});

function adaptResult(result) {
  if (result.command === 'SELECT' || result.command === 'SHOW') {
    return [result.rows, result.fields];
  }
  const metadata = {
    affectedRows: result.rowCount,
    insertId: null,
    rowCount: result.rowCount,
    rows: result.rows
  };
  return [metadata, result.fields];
}

async function executeWith(client, sql, values = []) {
  const result = await client.query(sql, values);
  return adaptResult(result);
}

function wrapClient(client) {
  return {
    execute: (sql, values) => executeWith(client, sql, values),
    query: (sql, values) => executeWith(client, sql, values),
    beginTransaction: () => client.query('BEGIN'),
    commit: () => client.query('COMMIT'),
    rollback: () => client.query('ROLLBACK'),
    release: () => client.release()
  };
}

export const pool = {
  execute: (sql, values) => executeWith(nativePool, sql, values),
  query: (sql, values) => executeWith(nativePool, sql, values),
  async getConnection() {
    return wrapClient(await nativePool.connect());
  },
  end: () => nativePool.end()
};

export async function checkDatabaseConnection() {
  const result = await nativePool.query(`
    SELECT current_database() database_name,
           version() server_version,
           COALESCE((SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()), false) ssl_enabled,
           (SELECT cipher FROM pg_stat_ssl WHERE pid=pg_backend_pid()) ssl_cipher
  `);
  return {
    connected: true,
    // Supabase's pooler terminates client TLS before the database session, so
    // pg_stat_ssl may be false even though this client connected with TLS.
    ssl: Boolean(databaseConfig.ssl),
    sslCipher: result.rows[0].ssl_cipher,
    database: result.rows[0].database_name,
    serverVersion: result.rows[0].server_version
  };
}

export async function checkDatabaseSchema() {
  if (schemaCache && Date.now() - schemaCache.checkedAt < SCHEMA_CACHE_MS) {
    return schemaCache.value;
  }

  const [rows] = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  const tables = new Set(rows.map((row) => row.table_name));
  const missingTables = requiredTables.filter((table) => !tables.has(table));
  const [columnRows] = await pool.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `);
  const columns = new Set(columnRows.map((row) => `${row.table_name}.${row.column_name}`));
  const missingColumns = requiredColumns
    .map(([table, column]) => `${table}.${column}`)
    .filter((column) => !columns.has(column));

  const value = {
    ready: missingTables.length === 0 && missingColumns.length === 0,
    tableCount: tables.size,
    missingTables,
    missingColumns
  };
  schemaCache = { checkedAt: Date.now(), value };
  return value;
}
