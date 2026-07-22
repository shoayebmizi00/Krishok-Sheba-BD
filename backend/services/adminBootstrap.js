import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

export async function configureAdmin(connection, { email, password, fullName, resetExistingPassword = false }) {
  const [existing] = await connection.execute(
    'SELECT id, role, is_active FROM users WHERE email = $1 LIMIT 1',
    [email]
  );

  if (existing[0]) {
    const updates = ["role = 'admin'", 'is_active = TRUE'];
    const values = [];
    if (resetExistingPassword) {
      if (password.length < 8) throw new Error('--reset-password requires ADMIN_PASSWORD with at least 8 characters.');
      updates.push('password_hash = $1');
      values.push(await bcrypt.hash(password, 12));
    }
    await connection.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length + 1}`,
      [...values, existing[0].id]
    );
    return { action: 'verified', passwordReset: resetExistingPassword };
  }

  if (password.length < 8) throw new Error('ADMIN_PASSWORD must contain at least 8 characters when creating a new admin.');
  if (!fullName) throw new Error('ADMIN_NAME is required when creating a new admin.');
  const passwordHash = await bcrypt.hash(password, 12);
  await connection.execute(
    `INSERT INTO users (id, email, password_hash, full_name, role, is_active)
     VALUES ($1, $2, $3, $4, 'admin', TRUE)`,
    [crypto.randomUUID(), email, passwordHash, fullName]
  );
  return { action: 'created', passwordReset: false };
}
