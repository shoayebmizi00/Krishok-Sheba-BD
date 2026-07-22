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

  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error('DATABASE_URL is not a valid PostgreSQL connection URL');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must use the PostgreSQL protocol');
  }

  const localHost = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  let user;
  let password;
  let database;
  try {
    user = decodeURIComponent(url.username);
    password = decodeURIComponent(url.password);
    database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  } catch {
    throw new Error('DATABASE_URL contains invalid URL encoding');
  }
  if (!user || !database) {
    throw new Error('DATABASE_URL must include a user and database name');
  }

  return {
    host: url.hostname,
    port: parsePositiveInteger(url.port, 5432, 'DATABASE_URL port'),
    database,
    user,
    password,
    max: parsePositiveInteger(process.env.DB_CONNECTION_LIMIT, 5, 'DB_CONNECTION_LIMIT'),
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
    keepAlive: true,
    // Supabase's session pooler presents a chain that Render does not trust.
    // DATABASE_URL query options (including sslmode) are intentionally ignored
    // so pg cannot overwrite this trial-project TLS policy while reparsing it.
    ssl: localHost ? false : { rejectUnauthorized: false }
  };
}
