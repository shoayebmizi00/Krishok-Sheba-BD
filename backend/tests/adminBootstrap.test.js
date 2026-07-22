import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import { configureAdmin } from '../services/adminBootstrap.js';

test('admin bootstrap creates once and preserves an existing password and profile', async () => {
  let user = null;
  const connection = {
    async execute(sql, params) {
      if (sql.startsWith('SELECT id')) return [user ? [{ id: user.id, role: user.role, is_active: user.is_active }] : []];
      if (sql.startsWith('INSERT INTO users')) {
        user = { id: params[0], email: params[1], password_hash: params[2], full_name: params[3], role: 'admin', is_active: true };
        return [[{ id: user.id }]];
      }
      if (sql.startsWith('UPDATE users SET')) {
        user.role = 'admin';
        user.is_active = true;
        return [[]];
      }
      throw new Error(`Unexpected query: ${sql}`);
    }
  };

  const configuration = { email: 'admin@example.com', password: 'strong-password', fullName: 'Super Admin' };
  assert.equal((await configureAdmin(connection, configuration)).action, 'created');
  assert.equal(await bcrypt.compare(configuration.password, user.password_hash), true);
  const firstHash = user.password_hash;
  const firstName = user.full_name;

  assert.equal((await configureAdmin(connection, { ...configuration, password: 'different-password', fullName: 'Changed' })).action, 'verified');
  assert.equal(user.password_hash, firstHash);
  assert.equal(user.full_name, firstName);
  assert.equal(user.role, 'admin');
});
