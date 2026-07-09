import nodemailer from 'nodemailer';

const requiredSmtpVariables = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM'];
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

export function getEmailConfiguration() {
  const missing = requiredSmtpVariables.filter((name) => !String(process.env[name] || '').trim());
  return { configured: missing.length === 0, missing };
}

export async function sendPasswordResetEmail({ to, name, resetUrl, expiresMinutes }) {
  const configuration = getEmailConfiguration();
  if (!configuration.configured) return { sent: false, reason: 'not_configured' };

  const port = Number(process.env.SMTP_PORT);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  });
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
