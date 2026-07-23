import { checkDatabaseConnection, pool } from '../config/db.js';

try {
  const [rows] = await pool.execute('SELECT 1 AS ok');
  if (rows[0]?.ok !== 1) {
    throw new Error('PostgreSQL SELECT 1 returned an unexpected result');
  }

  const connection = await checkDatabaseConnection();
  console.log(
    `[startup] PostgreSQL connection ready (database=${connection.database}, ssl=${connection.ssl})`
  );
} catch (error) {
  console.error(
    `[startup] PostgreSQL connection failed (${error.code || error.name || 'UNKNOWN'}): ${error.message}`
  );
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
}
