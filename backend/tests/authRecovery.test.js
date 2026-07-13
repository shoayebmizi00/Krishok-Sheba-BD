import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { login, requestPasswordReset, resetPassword } from '../controllers/authController.js';

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function invoke(handler, body) {
  const res = response();
  let failure;
  return Promise.resolve(handler({ body, id: 'test-request' }, res, (error) => { failure = error; }))
    .then(() => {
      if (failure) throw failure;
      return res;
    });
}

test('account recovery is enumeration-safe and reset tokens are single-use', async () => {
  const originalExecute = pool.execute;
  const originalGetConnection = pool.getConnection;
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const user = {
    id: 'user-1',
    email: 'user@example.com',
    full_name: 'Test User',
    role: 'farmer',
    is_active: true,
    password_hash: await bcrypt.hash('Old-password1', 4),
    reset_password_token: null,
    reset_password_expires: null
  };

  pool.execute = async (sql, params) => {
    if (sql.startsWith('SELECT id, email')) {
      return [params[0] === user.email ? [{ id: user.id, email: user.email, full_name: user.full_name }] : []];
    }
    if (sql.startsWith('UPDATE users SET reset_password_token')) {
      user.reset_password_token = params[0];
      user.reset_password_expires = Date.now() + params[1] * 60_000;
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('SELECT * FROM users WHERE email')) {
      return [params[0] === user.email ? [user] : []];
    }
    throw new Error(`Unexpected pool query: ${sql}`);
  };

  const connection = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql, params) => {
      if (sql.startsWith('SELECT id FROM users WHERE reset_password_token')) {
        const valid = user.reset_password_token === params[0] && user.reset_password_expires > Date.now();
        return [valid ? [{ id: user.id }] : []];
      }
      if (sql.startsWith('UPDATE users SET password_hash')) {
        user.password_hash = params[0];
        user.reset_password_token = null;
        user.reset_password_expires = null;
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected transaction query: ${sql}`);
    }
  };
  pool.getConnection = async () => connection;

  try {
    const known = await invoke(requestPasswordReset, { email: user.email });
    const unknown = await invoke(requestPasswordReset, { email: 'unknown@example.com' });
    assert.equal(known.statusCode, 200);
    assert.deepEqual(known.body, unknown.body);
    assert.equal(Object.hasOwn(known.body, 'resetToken'), false);

    const rawToken = 'a'.repeat(64);
    user.reset_password_token = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.reset_password_expires = Date.now() + 60_000;
    const reset = await invoke(resetPassword, { token: rawToken, newPassword: 'New-password1' });
    assert.equal(reset.statusCode, 200);
    assert.equal(user.role, 'farmer');
    assert.equal(user.full_name, 'Test User');

    const reused = await invoke(resetPassword, { token: rawToken, newPassword: 'Another-password1' });
    assert.equal(reused.statusCode, 400);
    assert.equal((await invoke(login, { email: user.email, password: 'Old-password1' })).statusCode, 401);
    assert.equal((await invoke(login, { email: user.email, password: 'New-password1' })).statusCode, 200);

    const expiredToken = 'b'.repeat(64);
    user.reset_password_token = crypto.createHash('sha256').update(expiredToken).digest('hex');
    user.reset_password_expires = Date.now() - 1;
    assert.equal((await invoke(resetPassword, { token: expiredToken, newPassword: 'Valid-password1' })).statusCode, 400);
    assert.equal((await invoke(resetPassword, { token: 'c'.repeat(64), newPassword: 'Valid-password1' })).statusCode, 400);
  } finally {
    pool.execute = originalExecute;
    pool.getConnection = originalGetConnection;
    process.env.NODE_ENV = originalNodeEnv;
  }
});
