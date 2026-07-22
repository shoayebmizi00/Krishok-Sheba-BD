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

2. Set `DATABASE_URL` to a PostgreSQL connection URL, set `DB_SSL` as required
   by the provider, and replace `JWT_SECRET`. Never place a database URL or
   secret key in `frontend/.env`.

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

## Database migrations

The backend applies ordered PostgreSQL migrations from `database/postgresql`
before startup:

```powershell
npm.cmd --prefix backend run migrate
```

During the Aiven-to-Supabase transition, source data can be inventoried without
writing to PostgreSQL:

```powershell
npm.cmd --prefix backend run data:transfer
```

Adding `-- --execute` performs the resumable upsert after backups and approval.
Validation is separate:

```powershell
npm.cmd --prefix backend run data:validate
```

See [the PostgreSQL migration runbook](docs/POSTGRESQL_MIGRATION.md) before any
production cutover. The original MySQL schema and migrations are intentionally
retained until production data and rollback readiness are verified.

## Local demo mode

Vite development uses the local demo API by default. Set
`VITE_USE_LOCAL_API=false` to use Express. Demo state persists in browser
`localStorage`.

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
- [PostgreSQL migration runbook](docs/POSTGRESQL_MIGRATION.md)
- [Postman collection](postman/KRISHOK-SHEBA-BD.postman_collection.json)
- [PostgreSQL schema](database/postgresql/001_initial_schema.sql)
