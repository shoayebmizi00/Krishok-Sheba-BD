import { checkDatabaseConnection, checkDatabaseSchema, pool } from '../config/db.js';

try {
  const [probe] = await pool.execute('SELECT 1 AS ok');
  if (probe[0]?.ok !== 1) throw new Error('Database probe returned an unexpected result');

  const connection = await checkDatabaseConnection();
  const schema = await checkDatabaseSchema();
  if (!schema.ready || schema.tableCount !== 18) {
    throw new Error(`Expected schema is incomplete (${schema.tableCount}/18 tables)`);
  }

  console.log('PostgreSQL connection successful');
  console.log(`PostgreSQL server: ${connection.serverVersion.split(',')[0]}`);
  console.log(`Expected application tables detected: ${schema.tableCount}`);
} catch (error) {
  console.error(`PostgreSQL verification failed (${error.code || 'SCHEMA_CHECK_FAILED'})`);
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
}
