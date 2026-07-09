# KRISHOK-SHEBA BD

Self-hosted agricultural marketplace built with React, Vite, Tailwind CSS, Express, MySQL, JWT, bcryptjs, and Multer.

## Requirements

- Node.js 20+
- npm 10+
- MySQL 8+

## Setup

1. Create the database:

   ```powershell
   mysql -u root -p < database/schema.sql
   ```

2. Configure environment files:

   ```powershell
   Copy-Item frontend/.env.example frontend/.env
   Copy-Item backend/.env.example backend/.env
   ```

   Update the MySQL credentials and replace `JWT_SECRET` in `backend/.env`.

3. Install dependencies:

   ```powershell
   npm.cmd --prefix frontend install
   npm.cmd --prefix backend install
   ```

4. Start the API:

   ```powershell
   npm.cmd --prefix backend start
   ```

5. In another terminal, start the frontend:

   ```powershell
   npm.cmd --prefix frontend run dev
   ```

Frontend: `http://localhost:5173`

API: `http://localhost:5000/api`

Health check: `http://localhost:5000/api/health`

On Windows PowerShell systems that allow npm scripts, `npm` can be used instead of `npm.cmd`.

## Local Demo Mode

Vite development uses the local demo API by default, so pages remain testable when MySQL or Express is stopped. Demo changes persist in browser `localStorage`.

Set `VITE_USE_LOCAL_API=false` in `frontend/.env` to use the Express API instead.

All demo accounts use password `123456`:

- `admin@example.com`
- `farmer@example.com`
- `buyer@example.com`
- `equipment@example.com`
- `transport@example.com`

## Administrator Account

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`, then create or promote the
account with the idempotent bootstrap command:

```sh
npm --prefix backend run admin:create
```

See [docs/AUTHENTICATION_RECOVERY_ADMIN.md](docs/AUTHENTICATION_RECOVERY_ADMIN.md)
for Render Shell usage and intentional password replacement.

## Password Reset

Password recovery requires SMTP configuration. Reset tokens are never returned by
the API or logged. Configure the SMTP variables documented in
[docs/AUTHENTICATION_RECOVERY_ADMIN.md](docs/AUTHENTICATION_RECOVERY_ADMIN.md).

## Production uploads

Render's local filesystem is temporary. Configure these backend environment variables for permanent image storage:

```text
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Without Cloudinary, production uploads are stored persistently in Aiven MySQL. Local development continues to use the local `uploads` directory.

## Database migrations

The backend applies idempotent SQL migrations before starting:

```powershell
npm.cmd --prefix backend run migrate
```

## Documentation

- [API reference](docs/API.md)
- [Migration report](docs/MIGRATION_REPORT.md)
- [Postman collection](postman/KRISHOK-SHEBA-BD.postman_collection.json)
- [Database schema](database/schema.sql)
