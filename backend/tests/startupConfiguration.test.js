import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

test('production startup is pinned to the PostgreSQL backend', async () => {
  const packageJson = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url)));
  const renderConfig = await fs.readFile(new URL('../../render.yaml', import.meta.url), 'utf8');
  const schemaInitializer = await fs.readFile(
    new URL('../scripts/initialize-database.js', import.meta.url),
    'utf8'
  );
  const databaseConfig = await fs.readFile(
    new URL('../config/databaseConfig.js', import.meta.url),
    'utf8'
  );

  assert.equal(packageJson.scripts.start, 'node scripts/start-production.js');
  assert.equal(packageJson.dependencies.pg, '^8.16.3');
  assert.match(renderConfig, /rootDir: backend/);
  assert.match(renderConfig, /startCommand: npm start/);
  assert.doesNotMatch(schemaInitializer, /createConnection|connection\.end/);
  assert.match(databaseConfig, /process\.env\.DATABASE_URL/);
  assert.match(databaseConfig, /rejectUnauthorized: false/);
  assert.doesNotMatch(databaseConfig, /DB_(?!CONNECTION|IDLE|QUERY|STATEMENT)/);
});
