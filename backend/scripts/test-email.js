import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { getEmailConfiguration, verifyEmailTransport } from '../services/emailService.js';

dotenv.config();
const recipient = String(process.env.TEST_EMAIL || '').trim();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
  console.error('TEST_EMAIL must be set to a valid dedicated test recipient.');
  process.exit(1);
}
const result = await verifyEmailTransport();
if (!result.verified) {
  console.error(`SMTP configuration invalid: missing=${result.configuration.missing.join(',') || 'none'} invalid=${result.configuration.invalid.join(',') || 'none'}`);
  process.exit(1);
}
const port = Number(process.env.SMTP_PORT);
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST, port,
  secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
});
await transport.sendMail({
  from: process.env.EMAIL_FROM, to: recipient,
  subject: 'KRISHOK-SHEBA BD SMTP test',
  text: 'SMTP configuration is working. This message contains no account or authentication data.'
});
console.log('SMTP connection verified and test message accepted for delivery.');

