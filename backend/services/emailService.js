import nodemailer from 'nodemailer';

const requiredSmtpVariables = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

export function getEmailConfiguration() {
  const missing = requiredSmtpVariables.filter((name) => !String(process.env[name] || '').trim());
  const invalid = [];
  const port = Number(process.env.SMTP_PORT);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  if (!missing.includes('SMTP_HOST') && !/^[a-z0-9.-]+$/i.test(process.env.SMTP_HOST)) invalid.push('SMTP_HOST');
  if (!missing.includes('SMTP_PORT') && (!Number.isInteger(port) || port < 1 || port > 65535)) invalid.push('SMTP_PORT');
  if (!missing.includes('SMTP_USER') && !emailPattern.test(process.env.SMTP_USER)) invalid.push('SMTP_USER');
  if (!missing.includes('EMAIL_FROM') && !emailPattern.test(extractAddress(process.env.EMAIL_FROM))) invalid.push('EMAIL_FROM');
  if ((port === 465 && !secure) || (port === 587 && secure)) invalid.push('SMTP_PORT/SMTP_SECURE');
  return { configured: missing.length === 0 && invalid.length === 0, missing, invalid };
}

const extractAddress = (value) => String(value).match(/<([^>]+)>/)?.[1] || String(value).trim();

function createTransport() {
  const port = Number(process.env.SMTP_PORT);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  });
}

export async function verifyEmailTransport() {
  const configuration = getEmailConfiguration();
  if (!configuration.configured) return { verified: false, configuration };
  await createTransport().verify();
  return { verified: true, configuration };
}

export async function sendPasswordResetEmail({ to, name, resetUrl, expiresMinutes }) {
  const configuration = getEmailConfiguration();
  if (!configuration.configured) return { sent: false, reason: 'not_configured' };

  const transport = createTransport();
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const safeGreeting = escapeHtml(greeting);
  const safeResetUrl = escapeHtml(resetUrl);
  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Reset your KRISHOK-SHEBA BD password',
    text: `${greeting}\n\nUse this link to reset your password within ${expiresMinutes} minutes:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>${safeGreeting}</p><p>Use this link to reset your password within ${expiresMinutes} minutes:</p><p><a href="${safeResetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`
  });
  return { sent: true };
}

export async function sendVerificationEmail({ to, name, verificationUrl, expiresMinutes }) {
  const configuration = getEmailConfiguration();
  if (!configuration.configured) return { sent: false, reason: 'not_configured' };
  const transport = createTransport();
  const greeting = name ? `Hello ${name},` : 'Hello,';
  await transport.sendMail({
    from: process.env.EMAIL_FROM, to,
    subject: 'Verify your KRISHOK-SHEBA BD email',
    text: `${greeting}\n\nVerify your email within ${expiresMinutes} minutes:\n${verificationUrl}`,
    html: `<p>${escapeHtml(greeting)}</p><p>Verify your email within ${expiresMinutes} minutes:</p><p><a href="${escapeHtml(verificationUrl)}">Verify email</a></p>`
  });
  return { sent: true };
}
