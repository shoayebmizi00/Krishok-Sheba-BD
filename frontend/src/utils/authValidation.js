export const PASSWORD_RULES = [
  { key: 'minLength', test: (value) => value.length >= 8 },
  { key: 'uppercase', test: (value) => /[A-Z]/.test(value) },
  { key: 'lowercase', test: (value) => /[a-z]/.test(value) },
  { key: 'number', test: (value) => /\d/.test(value) }
];

export function getPasswordChecks(value = '') {
  return Object.fromEntries(PASSWORD_RULES.map((rule) => [rule.key, rule.test(value)]));
}

export function isStrongPassword(value) {
  return typeof value === 'string'
    && value.length <= 128
    && PASSWORD_RULES.every((rule) => rule.test(value));
}

export function getAuthErrorMessage(error, t, fallbackKey) {
  const keyByCode = {
    EMAIL_EXISTS: 'auth.emailExists',
    INVALID_EMAIL: 'validation.invalidEmail',
    INVALID_PASSWORD: 'validation.passwordRequirements',
    FULL_NAME_REQUIRED: 'validation.fullNameRequired',
    INVALID_ROLE: 'auth.invalidRole',
    EMAIL_NOT_VERIFIED: 'auth.emailNotVerified',
    INVALID_CREDENTIALS: 'auth.invalidCredentials',
    INVALID_OR_EXPIRED_RESET_TOKEN: 'auth.invalidResetLink',
    INVALID_RESET_REQUEST: 'validation.passwordRequirements',
    TOO_MANY_ATTEMPTS: 'auth.tooManyAttempts'
  };
  return t(keyByCode[error?.data?.code] || fallbackKey);
}
