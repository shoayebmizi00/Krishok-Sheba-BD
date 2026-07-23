# Supabase PostgreSQL deployment runbook

## Target architecture

KRISHOK-SHEBA BD uses React -> the existing Node.js/Express Render service ->
Supabase PostgreSQL. Express owns JWT/bcrypt authentication and all database
access. The browser never receives a database URL or accesses application tables
directly.

This is a fresh-database cutover. No legacy database connection, export, data
transfer, checksum comparison, or user migration is part of this procedure.

## Connection and security

The backend reads only `DATABASE_URL`. For the continuously running Render
service, use the complete rotated Supabase session-pooler URL on port 5432. Store
it only in the existing Render service's Environment page; never commit it.

The centralized `pg.Pool` uses a small configurable pool, SSL, connection and
idle timeouts, parameterized values, sanitized errors, and graceful shutdown.
The schema enables RLS and revokes table access from Supabase's browser
roles. RLS does not block the direct database owner used by the backend.

## Repeatable initialization

From `backend`:

```powershell
npm run db:check
npm run db:init
npm run db:seed
npm run admin:create
```

- `db:check` runs `SELECT 1`, identifies the PostgreSQL server, and requires all
  18 application tables without logging credentials.
- `db:init` applies the idempotent schema and then the seed.
- `db:seed` upserts required categories, units, districts, payment methods,
  notice types, and story categories. Re-running it creates no duplicates.
- `admin:create` uses `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`. It
  normalizes the email, hashes once with bcryptjs, preserves an existing account,
  and never depends on SMTP.

`npm start` applies the idempotent schema, seeds configuration, conditionally
creates the configured administrator, and then starts Express.

## Existing Render service cutover

1. Ensure the PostgreSQL branch is tested and merged to `main`.
2. In the existing backend service, retain JWT, frontend URL, CORS, admin, SMTP,
   upload, and other current runtime variables.
3. Add or replace `DATABASE_URL` with the rotated session-pooler URL.
4. Deploy the latest `main`; do not create another service or change the service
   URL.
5. Watch logs for successful schema/seed/admin initialization and server
   startup. Logs must not contain credentials.
6. Check `/api/health`, then run disposable registration and core workflow smoke
   tests through the existing API URL.
7. Remove only the test-generated records after those tests.

The frontend API URL and public API routes must remain unchanged.

## Verification gate

Do not call the production cutover complete until the existing Render deployment
and health endpoint prove the Supabase connection, administrator login works,
all four public roles can register/login, and listing, bid, order, booking,
transport, transaction, message, and notification smoke tests pass.

Local disposable PostgreSQL verification completed on 2026-07-23: 18 tables,
18 primary keys, 27 foreign keys, 5 unique constraints, 78 indexes, and RLS on
all 18 application tables. The idempotent seed produced 104 configuration rows.
Authentication, role workflows, rollback, partial/sold-out inventory, duplicate
order prevention, and two-buyer concurrency passed. These results do not replace
the production Render gate.

## Cleanup after production verification

Obsolete conversion scripts and schemas have been removed. Preserve Git history,
the active PostgreSQL initialization schema, tests, deployment documentation,
and current rollback notes.
