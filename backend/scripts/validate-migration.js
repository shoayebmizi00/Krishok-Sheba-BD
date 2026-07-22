import crypto from 'node:crypto';
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
  dateStrings: true
});

function digest(ids) {
  return crypto.createHash('sha256').update(ids.sort().join('\n')).digest('hex');
}

const report = { generatedAt: new Date().toISOString(), tables: {}, checks: {} };
let valid = true;

try {
  for (const table of tables) {
    const [sourceRows] = await source.query('SELECT id FROM ?? ORDER BY id', [table]);
    const [targetRows] = await pool.execute(`SELECT id::text id FROM ${table} ORDER BY id`);
    const sourceIds = sourceRows.map((row) => String(row.id));
    const targetIds = targetRows.map((row) => String(row.id));
    const entry = {
      sourceCount: sourceIds.length, targetCount: targetIds.length,
      sourceIdChecksum: digest(sourceIds), targetIdChecksum: digest(targetIds)
    };
    entry.matches = entry.sourceCount === entry.targetCount && entry.sourceIdChecksum === entry.targetIdChecksum;
    if (!entry.matches) valid = false;
    report.tables[table] = entry;
  }

  const orphanChecks = [
    ['crop_listings.farmer_id', 'crop_listings', 'farmer_id', 'users'],
    ['bids.listing_id', 'bids', 'listing_id', 'crop_listings'],
    ['bids.buyer_id', 'bids', 'buyer_id', 'users'],
    ['messages.conversation_id', 'messages', 'conversation_id', 'conversations'],
    ['orders.buyer_id', 'orders', 'buyer_id', 'users'],
    ['orders.seller_id', 'orders', 'seller_id', 'users'],
    ['transactions.order_id', 'transactions', 'order_id', 'orders']
  ];
  report.checks.orphans = {};
  for (const [name, child, column, parent] of orphanChecks) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) count FROM ${child} c LEFT JOIN ${parent} p ON p.id=c.${column}
       WHERE c.${column} IS NOT NULL AND p.id IS NULL`
    );
    report.checks.orphans[name] = Number(rows[0].count);
    if (Number(rows[0].count) !== 0) valid = false;
  }

  const [passwordRows] = await pool.execute('SELECT password_hash FROM users');
  report.checks.bcryptHashes = {
    total: passwordRows.length,
    validFormat: passwordRows.filter((row) => /^\$2[aby]\$\d{2}\$/.test(row.password_hash)).length
  };
  if (report.checks.bcryptHashes.total !== report.checks.bcryptHashes.validFormat) valid = false;
  const [roles] = await pool.execute('SELECT role,COUNT(*) count FROM users GROUP BY role ORDER BY role');
  const [orderTotals] = await pool.execute('SELECT COUNT(*) count,COALESCE(SUM(total_amount),0) total FROM orders');
  const [transactionTotals] = await pool.execute('SELECT COUNT(*) count,COALESCE(SUM(amount),0) total FROM transactions');
  report.checks.roles = roles;
  report.checks.orderTotals = orderTotals[0];
  report.checks.transactionTotals = transactionTotals[0];
  report.valid = valid;
  console.log(JSON.stringify(report, null, 2));
  if (!valid) process.exitCode = 1;
} finally {
  await source.end();
  await pool.end();
}
