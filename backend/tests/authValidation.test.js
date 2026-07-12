import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidEmail, normalizeEmail, passwordPolicy } from '../utils/authValidation.js';

test('email normalization and validation reject malformed registrations', () => {
  assert.equal(normalizeEmail('  User@Example.COM '), 'user@example.com');
  for (const email of ['abc', 'abc@', '@gmail.com', 'user@domain', 'user domain@gmail.com', 'user@@gmail.com', 'user@gmail..com']) assert.equal(isValidEmail(email), false, email);
  for (const email of ['user@gmail.com', 'md.shoayeb@example.com', 'user123@outlook.com']) assert.equal(isValidEmail(email), true, email);
});

test('one password policy is enforced for registration and reset', () => {
  assert.equal(passwordPolicy.test('weak-password'), false);
  assert.equal(passwordPolicy.test('Strong-password1'), true);
});
