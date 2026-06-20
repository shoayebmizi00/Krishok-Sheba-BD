import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const requiredTables = [
  'users',
  'crop_listings',
  'bids',
  'conversations',
  'messages',
  'equipment',
  'equipment_bookings',
  'vehicles',
  'transport_bookings',
  'products',
  'orders',
  'transactions',
  'notifications',
  'government_notices',
  'market_prices'
];
const requiredColumns = [
  ['users', 'role'],
  ['crop_listings', 'category'],
  ['crop_listings', 'images'],
  ['conversations', 'participant_ids'],
  ['messages', 'sender_id'],
  ['messages', 'receiver_id']
];

const configuredSsl = String(process.env.DB_SSL || '').toLowerCase();
const isAivenHost = String(process.env.DB_HOST || '').endsWith('.aivencloud.com');
const sslEnabled = isAivenHost || ['true', '1', 'required'].includes(
  configuredSsl
);
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'krishok_sheba_bd',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  decimalNumbers: true,
  dateStrings: true,
  ssl: sslEnabled
    ? {
        rejectUnauthorized
      }
    : undefined
});

export async function checkDatabaseConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    const [rows] = await connection.query("SHOW STATUS LIKE 'Ssl_cipher'");
    const sslCipher = rows[0]?.Value || null;

    if (sslEnabled && !sslCipher) {
      throw new Error('MySQL connected without the required SSL encryption');
    }

    return {
      connected: true,
      ssl: Boolean(sslCipher),
      sslCipher
    };
  } finally {
    connection.release();
  }
}

export async function checkDatabaseSchema() {
  const [rows] = await pool.query(
    'SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()'
  );
  const tables = new Set(rows.map((row) => row.TABLE_NAME || row.table_name));
  const missingTables = requiredTables.filter((table) => !tables.has(table));
  const [columnRows] = await pool.query(
    'SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = DATABASE()'
  );
  const columns = new Set(columnRows.map((row) => `${row.TABLE_NAME || row.table_name}.${row.COLUMN_NAME || row.column_name}`));
  const missingColumns = requiredColumns
    .map(([table, column]) => `${table}.${column}`)
    .filter((column) => !columns.has(column));

  return {
    ready: missingTables.length === 0 && missingColumns.length === 0,
    tableCount: tables.size,
    missingTables,
    missingColumns
  };
}
