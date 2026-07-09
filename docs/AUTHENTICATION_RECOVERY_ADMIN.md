# Authentication, account recovery, and admin operations

## Current architecture

Authentication uses the `users` table, bcryptjs password hashes, bearer JWTs, and the
normal `/login` page for every role. The database's highest role is `admin`; there is
no separate `super_admin` database role or profile table. An administrator's profile
is therefore the same `users` row and does not require farmer-specific data.

Password recovery uses a 32-byte cryptographically random token. Only its SHA-256
hash is stored in `users.reset_password_token`, with an expiry in
`users.reset_password_expires`. A successful reset updates only the password hash and
clears both recovery fields in one locked transaction, making the token single-use.

## Email delivery on Render

Configure these environment variables in the Render service:

- `FRONTEND_URL`
- `RESET_TOKEN_EXPIRES_MINUTES`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true` for implicit TLS, normally port 465; otherwise `false`)
- `SMTP_USER`
- `SMTP_PASSWORD`
- `EMAIL_FROM`

Without all SMTP variables, the public endpoint still returns its neutral response,
but no email is sent. Secrets must be set in Render, never committed.

## Create or configure the highest-privilege admin

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in Render. From a Render Shell
whose working directory is the backend root, run:

```sh
npm run admin:create
```

From the repository root locally, run:

```sh
npm --prefix backend run admin:create
```

The command creates a missing user with one bcrypt hash and role `admin`. If the email
already exists, it preserves the profile and password while promoting/reactivating
the user. It is safe to run repeatedly. To intentionally replace an existing admin's
password, use this explicit one-off command:

```sh
node scripts/create-admin.js --reset-password
```

The normal login flow redirects role `admin` to `/admin`. Backend resource and
dashboard routes enforce this role; the protection does not depend on hidden buttons.
The server startup keeps the idempotent `--if-configured` check and no longer changes
an existing administrator's password on each deployment.
