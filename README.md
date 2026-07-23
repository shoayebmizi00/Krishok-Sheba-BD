# KRISHOK-SHEBA BD

Agricultural marketplace built with React, Vite, Tailwind CSS, Express,
PostgreSQL, JWT, bcryptjs, and Multer. Supabase PostgreSQL is used only through
the Express backend; authentication remains application-managed JWT/bcrypt.

## Requirements

- Node.js 22
- npm 10+
- PostgreSQL 15+

## Setup

1. Copy the environment templates:

   ```powershell
   Copy-Item frontend/.env.example frontend/.env
   Copy-Item backend/.env.example backend/.env
   ```

2. Set `DATABASE_URL` to a PostgreSQL connection URL and replace `JWT_SECRET`.
   `DB_CONNECTION_LIMIT` optionally controls the pool size. Never place a
   database URL or secret key in `frontend/.env`.

3. Install dependencies and start the applications:

   ```powershell
   npm.cmd --prefix frontend install
   npm.cmd --prefix backend install
   npm.cmd --prefix backend start
   npm.cmd --prefix frontend run dev
   ```

Frontend: `http://localhost:5173`

API: `http://localhost:5000/api`

Health check: `http://localhost:5000/api/health`

## Database initialization

The backend uses one PostgreSQL connection URL and an idempotent schema in
`database/postgresql`. Initialize a fresh database with:

```powershell
npm.cmd --prefix backend run db:init
```

This runs initialization and the idempotent configuration seed. It does not
create users, orders, messages, or transactions. Either part can also be run
independently:

```powershell
npm.cmd --prefix backend run db:schema
npm.cmd --prefix backend run db:seed
```

Verify the configured server and all 18 application tables without exposing the
connection URL:

```powershell
npm.cmd --prefix backend run db:check
```

`npm start` runs the safe, repeatable initialization before starting Express.
See [the PostgreSQL deployment runbook](docs/POSTGRESQL_DEPLOYMENT.md) before the
existing Render service is switched.

## Local development

The frontend always uses the configured Express API. Set `VITE_API_URL` when
the backend is not running at `http://localhost:5000/api`.

## Administrator and password recovery

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`, then run:

```powershell
npm.cmd --prefix backend run admin:create
```

SMTP and recovery configuration are documented in
[the authentication runbook](docs/AUTHENTICATION_RECOVERY_ADMIN.md).

## Production uploads

Render's local filesystem is temporary. Configure Cloudinary for permanent
uploads. Without Cloudinary, uploads are stored in PostgreSQL `bytea` rows.

## Documentation

- [API reference](docs/API.md)
- [PostgreSQL deployment runbook](docs/POSTGRESQL_DEPLOYMENT.md)
- [Postman collection](postman/KRISHOK-SHEBA-BD.postman_collection.json)
- [PostgreSQL schema](database/postgresql/schema.sql)
