import assert from 'node:assert/strict';
import test from 'node:test';
import { getEmailConfiguration } from '../services/emailService.js';

test('SMTP diagnostics accept secure port pairs without exposing values', () => {
  const names = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM'];
  const original = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  Object.assign(process.env, { SMTP_HOST: 'smtp.gmail.com', SMTP_PORT: '465', SMTP_SECURE: 'true', SMTP_USER: 'sender@example.com', SMTP_PASSWORD: 'not-a-real-secret', EMAIL_FROM: 'KRISHOK-SHEBA <sender@example.com>' });
  try {
    assert.deepEqual(getEmailConfiguration(), { configured: true, missing: [], invalid: [] });
    process.env.SMTP_SECURE = 'false';
    assert.deepEqual(getEmailConfiguration().invalid, ['SMTP_PORT/SMTP_SECURE']);
  } finally {
    for (const name of names) original[name] === undefined ? delete process.env[name] : process.env[name] = original[name];
  }
});
