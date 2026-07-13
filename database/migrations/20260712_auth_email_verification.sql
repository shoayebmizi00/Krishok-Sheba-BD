-- Verification columns are retained for compatibility. Registration no longer depends on them.
-- Applied idempotently by backend/scripts/migrate.js for MySQL compatibility.
SELECT 1;

-- Rollback (only after confirming no registrations depend on verification):
-- DROP INDEX idx_users_email_verification_token ON users;
-- ALTER TABLE users DROP COLUMN email_verification_expires, DROP COLUMN email_verification_token, DROP COLUMN email_verified;
