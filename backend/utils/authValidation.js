export const normalizeEmail = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';

export const isValidEmail = (value) => {
  const email = normalizeEmail(value);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  const [local, domain, ...rest] = email.split('@');
  return !rest.length && local.length <= 64 && !domain.includes('..')
    && domain.split('.').every((part) => part && !part.startsWith('-') && !part.endsWith('-'));
};

export const passwordPolicy = {
  minLength: 8,
  maxLength: 128,
  test(value) {
    return typeof value === 'string' && value.length >= 8 && value.length <= 128
      && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
  }
};

