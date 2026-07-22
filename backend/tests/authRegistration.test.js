import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { login, register } from '../controllers/authController.js';
import { dashboardPathForRole } from '../../frontend/src/routes/roleRoutes.js';

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

async function invoke(handler, body) {
  const res = response();
  let failure;
  await handler({ body, id: 'registration-test' }, res, (error) => { failure = error; });
  if (failure) throw failure;
  return res;
}

test('registration works without SMTP and new users can log in for every public role', async () => {
  const originalExecute = pool.execute;
  const originalGetConnection = pool.getConnection;
  const originalSecret = process.env.JWT_SECRET;
  const smtpNames = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM'];
  const originalSmtp = Object.fromEntries(smtpNames.map((name) => [name, process.env[name]]));
  process.env.JWT_SECRET = 'registration-test-secret-that-is-long-enough';
  smtpNames.forEach((name) => delete process.env[name]);

  const users = new Map();
  const admin = {
    id: 'existing-admin',
    email: 'admin@example.com',
    full_name: 'Existing Admin',
    role: 'admin',
    is_active: true,
    email_verified: false,
    password_hash: await bcrypt.hash('Admin-password1', 4)
  };
  users.set(admin.email, admin);

  const connection = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    async execute(sql, params) {
      if (sql.startsWith('SELECT id FROM users WHERE email')) {
        const user = users.get(params[0]);
        return [user ? [{ id: user.id }] : []];
      }
      if (sql.startsWith('INSERT INTO users')) {
        const [id, email, passwordHash, fullName, role] = params;
        if (users.has(email)) {
          const error = new Error('duplicate');
          error.code = '23505';
          throw error;
        }
        const user = {
          id,
          email,
          password_hash: passwordHash,
          full_name: fullName,
          role,
          is_active: true,
          email_verified: true,
          email_verification_token: null,
          email_verification_expires: null
        };
        users.set(email, user);
        return [[user]];
      }
      if (sql.startsWith('SELECT * FROM users WHERE id')) {
        return [[...users.values()].filter((user) => user.id === params[0])];
      }
      throw new Error(`Unexpected transaction query: ${sql}`);
    }
  };

  pool.getConnection = async () => connection;
  pool.execute = async (sql, params) => {
    if (sql.startsWith('SELECT * FROM users WHERE email')) {
      const user = users.get(params[0]);
      return [user ? [user] : []];
    }
    throw new Error(`Unexpected pool query: ${sql}`);
  };

  try {
    for (const [role, dashboard] of [
      ['farmer', '/farmer-dashboard'],
      ['buyer', '/buyer-dashboard'],
      ['equipment_owner', '/equipment-owner-dashboard'],
      ['transport_provider', '/transport-dashboard']
    ]) {
      const email = `${role}@example.com`;
      const created = await invoke(register, { full_name: `Test ${role}`, email: `  ${email.toUpperCase()}  `, password: 'Password1', role });
      assert.equal(created.statusCode, 201);
      assert.equal(created.body.user.email, email);
      assert.equal(created.body.user.is_active, true);
      assert.equal(created.body.user.email_verified, true);
      assert.equal(Object.hasOwn(created.body.user, 'password_hash'), false);
      assert.equal(await bcrypt.compare('Password1', users.get(email).password_hash), true);
      assert.notEqual(users.get(email).password_hash, 'Password1');

      const signedIn = await invoke(login, { email, password: 'Password1' });
      assert.equal(signedIn.statusCode, 200);
      assert.equal(signedIn.body.user.role, role);
      assert.equal(typeof signedIn.body.token, 'string');
      assert.equal(dashboardPathForRole(role), dashboard);
    }

    const invalidEmails = ['abc', 'abc@', '@gmail.com', 'user@domain', 'user@@gmail.com', 'user@gmail..com'];
    for (const email of invalidEmails) assert.equal((await invoke(register, { full_name: 'Invalid', email, password: 'Password1', role: 'farmer' })).body.code, 'INVALID_EMAIL');
    for (const password of ['Short1', 'password1', 'PASSWORD1', 'Password']) assert.equal((await invoke(register, { full_name: 'Weak', email: `weak-${password}@example.com`, password, role: 'farmer' })).body.code, 'INVALID_PASSWORD');
    const mismatch = await invoke(register, { full_name: 'Mismatch', email: 'mismatch@example.com', password: 'Password1', confirmPassword: 'Password2', role: 'farmer' });
    assert.equal(mismatch.statusCode, 400);
    assert.equal(mismatch.body.code, 'PASSWORD_MISMATCH');

    const duplicate = await invoke(register, { full_name: 'Duplicate', email: 'farmer@example.com', password: 'Password1', role: 'farmer' });
    assert.equal(duplicate.statusCode, 409);
    assert.equal(duplicate.body.code, 'EMAIL_EXISTS');
    assert.equal((await invoke(register, { full_name: 'Admin', email: 'new-admin@example.com', password: 'Password1', role: 'admin' })).body.code, 'INVALID_ROLE');

    const adminLogin = await invoke(login, { email: admin.email, password: 'Admin-password1' });
    assert.equal(adminLogin.statusCode, 200);
    assert.equal(adminLogin.body.user.role, 'admin');
    assert.equal(dashboardPathForRole('admin'), '/admin');
  } finally {
    pool.execute = originalExecute;
    pool.getConnection = originalGetConnection;
    process.env.JWT_SECRET = originalSecret;
    for (const name of smtpNames) originalSmtp[name] === undefined ? delete process.env[name] : process.env[name] = originalSmtp[name];
  }
});
