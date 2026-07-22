# PostgreSQL migration runbook

Status date: 2026-07-22  
Production readiness: **NOT READY**

The application database layer and an empty Supabase target have been prepared
for PostgreSQL. Production Aiven data has not been transferred, Render production
has not been changed, and Aiven must remain available.

## 1. Current database audit

The original backend used `mysql2/promise`, one 10-connection MySQL pool,
MySQL-style result arrays, `?` placeholders, direct SQL in controllers/routes,
a generic `BaseModel`, a MySQL migration runner, and a separate MySQL admin
connection. The checked-in schema contains 18 application tables, all using
36-character application-generated UUIDs as primary keys. Authentication uses
JWT and bcryptjs and is independent of Supabase Auth.

The source metadata query was read-only but Aiven closed the connection before
returning schema or row counts. Therefore repository schema is audited, but live
production column/default/count drift is not yet ruled out.

| File or area | MySQL-specific behavior found | PostgreSQL replacement | Risk | Required test |
|---|---|---|---|---|
| `backend/config/db.js` | `mysql2` pool, MySQL SSL status, array results | `pg` pool, PostgreSQL SSL/schema checks, internal result adapter | High | Pool, SSL, shutdown, error and health tests |
| `backend/config/databaseConfig.js` | `MYSQL_*`/`DB_*` connection assembly | Required `DATABASE_URL`, bounded pool/timeouts, SSL controls | High | Missing/invalid URL and Supabase session-pooler tests |
| Controllers, routes, middleware, services | `?`, `DATE_FORMAT`, `DATE_SUB`, `DATE_ADD`, `IF`, JSON functions, `<=>` | `$n`, `TO_CHAR`, intervals, `CASE`, JSONB containment, `IS NOT DISTINCT FROM` | High | Every API workflow and filter path |
| `backend/models/BaseModel.js` | Backticks, dynamic `?`, `JSON_CONTAINS` | Identifier allowlists, indexed `$n`, JSONB containment | High | CRUD, filters, ownership and participant scopes |
| `database/schema.sql` and old migrations | MySQL enums, `ON UPDATE`, JSON, LONGBLOB, inline indexes, engine clauses | Retained as source evidence; new ordered PostgreSQL schema | High | Schema diff against live Aiven before transfer |
| `backend/scripts/migrate.js` | MySQL metadata and migration execution | Ordered transactional PostgreSQL runner and ledger | High | Empty database plus idempotent rerun |
| Admin bootstrap | Separate MySQL connection | Shared PostgreSQL pool/client | High | Create, promote, preserve hash, explicit reset |
| Upload persistence | unsigned integer and LONGBLOB | nonnegative bigint and `bytea` | Medium | Upload, retrieve, size and MIME checks |
| Dashboard/report queries | MySQL date and boolean aggregation | PostgreSQL date and filtered aggregation | Medium | Farmer/admin dashboards with representative data |
| Environment/Render | Production Aiven `DB_*` values | Staging blueprint uses secret `DATABASE_URL` | High | Separate Render staging deployment |

Repository scans found no active MySQL SQL functions or `?` placeholders after
conversion. `mysql2` remains a development-only dependency solely for the
temporary source transfer and validation tools.

## 2. Schema conversion

`database/postgresql/001_initial_schema.sql` creates the 18 application tables,
indexes, foreign keys, unique constraints, checks, update triggers, and the exact
application role/status values. The principal conversions are:

- `CHAR(36)` application UUIDs to `uuid`, without changing ID generation.
- MySQL `ENUM` to `text` plus `CHECK` constraints.
- `JSON` to `jsonb`, `LONGBLOB` to `bytea`, unsigned file size to a nonnegative
  `bigint`, and date/time values to `date`, `time`, or `timestamptz`.
- `ON UPDATE CURRENT_TIMESTAMP` to a `BEFORE UPDATE` trigger.
- MySQL inline indexes to named PostgreSQL indexes, including a GIN index for
  conversation participants.

All application tables have RLS enabled and all table privileges are revoked from
Supabase `anon` and `authenticated`. Express connects directly to PostgreSQL;
React receives neither a database URL nor a privileged Supabase key.

## 3. Migration and test results

- Supabase session pooler: connected with encrypted SSL.
- PostgreSQL server: 17.6.
- Migration `001_initial_schema.sql`: applied successfully and recorded.
- Schema readiness: all required tables and columns present.
- Supabase target application row counts: zero after test cleanup.
- Unit/policy tests: 18 passed, 0 failed.
- HTTP smoke: registration for farmer, buyer, equipment owner, and transport
  provider; login; current user; health; listings; equipment; vehicles; notices;
  prices; stories; and settings passed.
- Password compatibility: a bcryptjs hash stored/retrieved through PostgreSQL
  authenticated without rehashing.
- Role compatibility: all four public roles retained exact names; `admin` remains
  supported by schema and bootstrap tests.
- Concurrency: two simultaneous 4-unit updates against 5 available units produced
  one success and one rejection under row locking; 1 unit remained.
- RLS verification: no `anon` or `authenticated` SELECT privilege on any
  application table.

Not yet verified: production row counts/checksums, real existing-user login,
admin login against migrated production data, full workflow matrix, performance
comparison, and Render staging deployment.

## 4. Data migration method

Set `SOURCE_DATABASE_URL` to the read-only/controlled Aiven connection and
`DATABASE_URL` to the Supabase staging session pooler. Back up Aiven first.

```powershell
npm.cmd --prefix backend run data:transfer
npm.cmd --prefix backend run data:transfer -- --execute
npm.cmd --prefix backend run data:validate
```

The first command is a count-only dry run. Execution processes tables in foreign
key order, batches rows, preserves primary keys/hashes/timestamps/nulls/JSON, and
uses `ON CONFLICT (id) DO UPDATE`, so reruns do not duplicate rows. UUID keys mean
no PostgreSQL sequence reset is required. Validation compares every table's count
and sorted-primary-key SHA-256 checksum, checks key orphan relationships and
bcrypt formats, and reports roles, order totals, and transaction totals.

Do not accept the migration until the validation command exits successfully and
the report has been saved with the deployment evidence.

## 5. Exact blockers

1. Aiven closed the source connection; live schema, row counts, and data checksums
   are unavailable.
2. No Aiven backup/export has been confirmed.
3. Production data has not been transferred or validated.
4. A separate Render staging service has not been deployed/tested.
5. Full role workflow, booking, payment, messaging, admin, concurrency, and
   performance matrices have not been completed with representative data.
6. Production cutover approval has not been given.
7. The database password and a privileged Supabase key were shared in chat; rotate
   both before production use. No supplied credential was written to Git.

## 6. Cutover procedure (approval required)

1. Freeze the migration branch and record the tested commit SHA.
2. Schedule maintenance and make a restorable Aiven backup.
3. Block production writes while leaving read/health access controlled.
4. Run the final idempotent transfer into the verified Supabase target.
5. Save a successful validation report and manually verify existing user/admin
   login plus critical reads and writes.
6. In Render, preserve the old Aiven variables, add secret `DATABASE_URL` using
   the Supabase session-mode pooler, set `DB_SSL=true`, the verified certificate
   setting, and `DB_POOL_MAX=5`.
7. Redeploy the exact staging-tested commit. Do not change the frontend API URL.
8. Verify `/api/health`, login/admin login, listing/bid/order/payment/booking/
   messaging/notification writes, logs, pool saturation, and latency.
9. Reopen writes and monitor. Keep Aiven intact through the rollback window.

## 7. Rollback procedure

The current branch is PostgreSQL-only at runtime, so rollback uses the last
known-good MySQL deployment commit as well as the preserved Render variables.

1. Block writes immediately and record the cutover timestamp.
2. Restore the previous Render commit/deploy and its `DB_HOST`, `DB_PORT`,
   `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and MySQL SSL variables.
3. Redeploy, verify health, existing-user login, admin login, and a controlled
   read/write.
4. Reconcile writes accepted by Supabase after cutover before reopening normal
   traffic; never silently discard them.
5. Keep both databases unchanged for investigation. Do not delete Aiven or
   Supabase data.

## 8. Files intentionally retained

- `database/schema.sql` and `database/migrations/*`: MySQL source-schema and
  audit/rollback evidence until production verification completes.
- `mysql2` development dependency and the two data scripts: required to read and
  validate Aiven during transfer; remove only after the rollback window.
- `render.yaml`: unchanged production Aiven configuration, intentionally
  preventing an unapproved cutover.
- `render.staging.yaml`: separate PostgreSQL staging blueprint.

Cleanup of retained MySQL evidence is intentionally deferred. Git history must
not be rewritten, and the frontend was not changed.
