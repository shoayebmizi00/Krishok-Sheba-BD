import assert from 'node:assert/strict';
import test from 'node:test';
import { getDatabaseConfig } from '../config/databaseConfig.js';

test('Supabase URL SSL query options cannot overwrite the explicit TLS policy', () => {
  const originalUrl = process.env.DATABASE_URL;
  const originalLimit = process.env.DB_CONNECTION_LIMIT;
  process.env.DATABASE_URL = 'postgresql://postgres.project-ref:p%40ssword@pooler.supabase.com:5432/postgres?sslmode=require';
  process.env.DB_CONNECTION_LIMIT = '4';

  try {
    const config = getDatabaseConfig();
    assert.equal(config.host, 'pooler.supabase.com');
    assert.equal(config.port, 5432);
    assert.equal(config.database, 'postgres');
    assert.equal(config.user, 'postgres.project-ref');
    assert.equal(config.password, 'p@ssword');
    assert.equal(config.max, 4);
    assert.deepEqual(config.ssl, { rejectUnauthorized: false });
    assert.equal(Object.hasOwn(config, 'connectionString'), false);
  } finally {
    originalUrl === undefined ? delete process.env.DATABASE_URL : process.env.DATABASE_URL = originalUrl;
    originalLimit === undefined ? delete process.env.DB_CONNECTION_LIMIT : process.env.DB_CONNECTION_LIMIT = originalLimit;
  }
});

test('local PostgreSQL connections do not require TLS', () => {
  const originalUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://postgres:test@127.0.0.1:5432/test?sslmode=require';
  try {
    assert.equal(getDatabaseConfig().ssl, false);
  } finally {
    originalUrl === undefined ? delete process.env.DATABASE_URL : process.env.DATABASE_URL = originalUrl;
  }
});
