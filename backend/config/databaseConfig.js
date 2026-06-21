function parseDatabaseUrl(value) {
  if (!value) {
    return {};
  }

  try {
    const url = new URL(value);
    return {
      host: url.hostname,
      port: url.port,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace(/^\//, ''))
    };
  } catch {
    throw new Error('MYSQL_URL/DATABASE_URL is not a valid MySQL connection URL');
  }
}

export function getDatabaseConfig() {
  const urlConfig = parseDatabaseUrl(
    process.env.MYSQL_URL
      || process.env.DATABASE_URL
      || process.env.MYSQL_PUBLIC_URL
  );
  const host = urlConfig.host
    || process.env.MYSQLHOST
    || process.env.DB_HOST
    || '127.0.0.1';
  const configuredSsl = String(process.env.DB_SSL || '').toLowerCase();
  const sslEnabled = host.endsWith('.aivencloud.com')
    || ['true', '1', 'required'].includes(configuredSsl);

  return {
    host,
    port: Number(
      urlConfig.port
        || process.env.MYSQLPORT
        || process.env.DB_PORT
        || 3306
    ),
    user: urlConfig.user
      || process.env.MYSQLUSER
      || process.env.DB_USER
      || 'root',
    password: urlConfig.password
      || process.env.MYSQLPASSWORD
      || process.env.MYSQL_ROOT_PASSWORD
      || process.env.DB_PASSWORD
      || '',
    database: urlConfig.database
      || process.env.MYSQLDATABASE
      || process.env.MYSQL_DATABASE
      || process.env.DB_NAME
      || 'krishok_sheba_bd',
    ssl: sslEnabled
      ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
        }
      : undefined
  };
}
