# Migration status

The earlier MySQL migration report is superseded by the active Supabase
PostgreSQL architecture and fresh-database deployment runbook.

See [POSTGRESQL_MIGRATION.md](POSTGRESQL_MIGRATION.md) for the current schema,
initialization, verification, Render cutover, and post-production cleanup gates.

The legacy SQL files under `database/` are historical evidence only. Active
runtime code uses the PostgreSQL schema under `database/postgresql/`.
