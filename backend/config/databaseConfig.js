function parsePositiveInteger(value, fallback, name) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

export function getDatabaseConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  let hostname;
  try {
    hostname = new URL(connectionString).hostname;
  } catch {
    throw new Error('DATABASE_URL is not a valid PostgreSQL connection URL');
  }

  const sslSetting = String(process.env.DB_SSL || '').toLowerCase();
  const sslEnabled = ['true', '1', 'required'].includes(sslSetting)
    || hostname.endsWith('.supabase.com');

  return {
    connectionString,
    max: parsePositiveInteger(process.env.DB_POOL_MAX, 5, 'DB_POOL_MAX'),
    idleTimeoutMillis: parsePositiveInteger(
      process.env.DB_IDLE_TIMEOUT_MS,
      30_000,
      'DB_IDLE_TIMEOUT_MS'
    ),
    connectionTimeoutMillis: parsePositiveInteger(
      process.env.DB_CONNECTION_TIMEOUT_MS,
      10_000,
      'DB_CONNECTION_TIMEOUT_MS'
    ),
    ssl: sslEnabled
      ? {
          rejectUnauthorized:
            String(process.env.DB_SSL_REJECT_UNAUTHORIZED).toLowerCase() !== 'false'
        }
      : false
  };
}
