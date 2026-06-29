# Migration Report

## Summary

KRISHOK-SHEBA BD now uses a self-hosted React/Express/MySQL architecture. Proprietary SDK, Vite plugin, generated entity files, hosted authentication calls, and hosted upload calls were removed.

## Removed

- Proprietary SDK client and app-parameter helpers
- Proprietary Vite plugin configuration
- Generated `entities/` schemas and RLS metadata
- Unused hosted-database client files and dependency
- Hosted OTP and Google-provider UI flows

## Frontend Changes

- Added `src/api/apiClient.js`, a fetch-based REST/JWT client.
- Migrated all entity list, filter, create, update, and delete calls.
- Migrated login, registration, logout, profile, forgot-password, and reset-password calls.
- Replaced hosted uploads with multipart uploads to local API folders.
- Replaced realtime message subscriptions with four-second REST polling.
- Restored the previously empty transport dashboard modules.
- Added missing authentication routes to React Router.

## Backend Added

- `backend/server.js`
- MySQL pool configuration
- JWT authentication and role middleware
- bcryptjs password hashing
- Generic allowlisted SQL model and CRUD controller
- Explicit model modules for all requested entities
- Authentication, resource, and upload routes
- Multer image storage under `backend/uploads/`
- Environment templates and backend package manifest

## Database

`database/schema.sql` creates:

- `users`
- `crop_listings`
- `bids`
- `conversations`
- `messages`
- `equipment`
- `equipment_bookings`
- `vehicles`
- `transport_bookings`
- `orders`
- `products`
- `transactions`
- `notifications`
- `government_notices`
- `market_prices`

The schema includes UUID primary keys, foreign keys, indexes, JSON fields, status enums, checks, and automatic creation/update timestamps.

## API and Tooling

- API reference: `docs/API.md`
- Postman collection: `postman/KRISHOK-SHEBA-BD.postman_collection.json`
- Frontend environment template: `.env.example`
- Backend environment template: `backend/.env.example`
- Root `npm run server` starts the backend.

## Verification

- `npm --prefix frontend install`: passed
- `npm --prefix backend install`: passed
- `npm --prefix frontend run build`: passed
- `npm --prefix backend run check`: passed
- `npm --prefix backend test`: passed
- Backend JavaScript syntax check: passed
- Source and lockfile scan for proprietary SDK references: passed

MySQL integration requests require a running local MySQL instance initialized with the provided schema.
