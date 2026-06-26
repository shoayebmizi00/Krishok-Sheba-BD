import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { getDatabaseConfig } from '../config/databaseConfig.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '..', 'database', 'schema.sql');
const migrationsDirectory = path.resolve(__dirname, '..', 'database', 'migrations');

async function tableExists(connection, table) {
  const [rows] = await connection.query(
    `
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    `,
    [table]
  );
  return rows.length > 0;
}

export async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `,
    [table, column]
  );
  return rows.length > 0;
}

export async function indexExists(connection, table, indexName) {
  const [rows] = await connection.query(
    `
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND INDEX_NAME = ?
    `,
    [table, indexName]
  );
  return rows.length > 0;
}

export async function constraintExists(connection, constraintName) {
  const [rows] = await connection.query(
    `
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = ?
    `,
    [constraintName]
  );
  return rows.length > 0;
}

async function addColumnIfMissing(connection, table, column, definition) {
  if (await columnExists(connection, table, column)) return;
  await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
}

async function addIndexIfMissing(connection, table, indexName, definition, requiredColumns) {
  if (await indexExists(connection, table, indexName)) return;
  const columnsReady = await Promise.all(
    requiredColumns.map((column) => columnExists(connection, table, column))
  );
  if (columnsReady.every(Boolean)) {
    await connection.query(`ALTER TABLE \`${table}\` ADD INDEX ${definition}`);
  }
}

async function addForeignKeyIfMissing(connection, table, constraintName, definition, requiredColumns) {
  if (await constraintExists(connection, constraintName)) return;
  const columnsReady = await Promise.all(
    requiredColumns.map((column) => columnExists(connection, table, column))
  );
  if (!columnsReady.every(Boolean) || !(await tableExists(connection, 'users'))) return;

  const [referencingColumn] = requiredColumns;
  const [[{ invalidReferences }]] = await connection.query(
    `
    SELECT COUNT(*) AS invalidReferences
    FROM \`${table}\` source
    LEFT JOIN users target ON target.id = source.\`${referencingColumn}\`
    WHERE source.\`${referencingColumn}\` IS NOT NULL
      AND target.id IS NULL
    `
  );
  if (Number(invalidReferences) > 0) {
    console.warn(
      `Skipped foreign key ${constraintName}: ${invalidReferences} existing ${table}.${referencingColumn} value(s) do not reference users.id`
    );
    return;
  }

  await connection.query(`ALTER TABLE \`${table}\` ADD CONSTRAINT ${definition}`);
}

async function applyDashboardMessagingMigration(connection) {
  if (await tableExists(connection, 'conversations')) {
    await addColumnIfMissing(connection, 'conversations', 'participant_one_id', 'participant_one_id CHAR(36) NULL AFTER id');
    await addColumnIfMissing(connection, 'conversations', 'participant_two_id', 'participant_two_id CHAR(36) NULL AFTER participant_one_id');
    await addColumnIfMissing(
      connection,
      'conversations',
      'related_type',
      "related_type ENUM('listing','bid','order','equipment_booking','transport_booking','user','general') NULL AFTER listing_name"
    );
    await addColumnIfMissing(connection, 'conversations', 'related_id', 'related_id CHAR(36) NULL AFTER related_type');
    await addColumnIfMissing(connection, 'conversations', 'last_message_at', 'last_message_at DATETIME NULL AFTER last_message_date');

    await addIndexIfMissing(
      connection,
      'conversations',
      'idx_conversations_participant_one',
      'idx_conversations_participant_one (participant_one_id,last_message_at)',
      ['participant_one_id', 'last_message_at']
    );
    await addIndexIfMissing(
      connection,
      'conversations',
      'idx_conversations_participant_two',
      'idx_conversations_participant_two (participant_two_id,last_message_at)',
      ['participant_two_id', 'last_message_at']
    );
    await addIndexIfMissing(
      connection,
      'conversations',
      'idx_conversations_related',
      'idx_conversations_related (related_type,related_id)',
      ['related_type', 'related_id']
    );

    if (
      await columnExists(connection, 'conversations', 'participant_one_id')
      && await columnExists(connection, 'conversations', 'participant_ids')
    ) {
      await connection.query(`
        UPDATE conversations
        SET participant_one_id = JSON_UNQUOTE(JSON_EXTRACT(participant_ids,'$[0]'))
        WHERE participant_one_id IS NULL
      `);
    }
    if (
      await columnExists(connection, 'conversations', 'participant_two_id')
      && await columnExists(connection, 'conversations', 'participant_ids')
    ) {
      await connection.query(`
        UPDATE conversations
        SET participant_two_id = JSON_UNQUOTE(JSON_EXTRACT(participant_ids,'$[1]'))
        WHERE participant_two_id IS NULL
      `);
    }
    if (
      await columnExists(connection, 'conversations', 'related_type')
      && await columnExists(connection, 'conversations', 'related_id')
      && await columnExists(connection, 'conversations', 'listing_id')
    ) {
      await connection.query(`
        UPDATE conversations
        SET related_type = IF(listing_id IS NULL,NULL,'listing'),
            related_id = listing_id
        WHERE related_type IS NULL
          AND related_id IS NULL
      `);
    }
    if (
      await columnExists(connection, 'conversations', 'last_message_at')
      && await columnExists(connection, 'conversations', 'last_message_date')
      && await columnExists(connection, 'conversations', 'updated_at')
    ) {
      await connection.query(`
        UPDATE conversations
        SET last_message_at = COALESCE(last_message_date,updated_at)
        WHERE last_message_at IS NULL
      `);
    }

    await addForeignKeyIfMissing(
      connection,
      'conversations',
      'fk_conversations_participant_one',
      'fk_conversations_participant_one FOREIGN KEY (participant_one_id) REFERENCES users(id) ON DELETE CASCADE',
      ['participant_one_id']
    );
    await addForeignKeyIfMissing(
      connection,
      'conversations',
      'fk_conversations_participant_two',
      'fk_conversations_participant_two FOREIGN KEY (participant_two_id) REFERENCES users(id) ON DELETE CASCADE',
      ['participant_two_id']
    );
  }

  if (await tableExists(connection, 'messages')) {
    await addColumnIfMissing(connection, 'messages', 'message_text', 'message_text TEXT NULL AFTER content');
    await addColumnIfMissing(connection, 'messages', 'is_read', 'is_read BOOLEAN NOT NULL DEFAULT FALSE AFTER message_text');
    await addIndexIfMissing(
      connection,
      'messages',
      'idx_messages_receiver_read_created',
      'idx_messages_receiver_read_created (receiver_id,is_read,created_at)',
      ['receiver_id', 'is_read', 'created_at']
    );

    if (
      await columnExists(connection, 'messages', 'message_text')
      && await columnExists(connection, 'messages', 'content')
    ) {
      await connection.query(`
        UPDATE messages
        SET message_text = content
        WHERE message_text IS NULL
      `);
    }
  }
}

const safeMigrationHandlers = new Map([
  ['20260626_dashboard_messaging.sql', applyDashboardMessagingMigration]
]);

const connection = await mysql.createConnection({
  ...getDatabaseConfig(),
  multipleStatements: true
});

try {
  const files = (await fs.readdir(migrationsDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const [[{ tableCount }]] = await connection.query(
    `
    SELECT COUNT(*) AS tableCount
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name <> 'schema_migrations'
    `
  );

  if (Number(tableCount) === 0) {
    const schema = await fs.readFile(schemaPath, 'utf8');
    await connection.query(schema);
    await Promise.all(files.map((file) => connection.execute(
      'INSERT IGNORE INTO schema_migrations (filename) VALUES (?)',
      [file]
    )));
    console.log('Initialized database schema');
    console.log('Recorded existing migrations from schema baseline');
  }

  for (const file of files) {
    const [applied] = await connection.execute(
      'SELECT filename FROM schema_migrations WHERE filename = ? LIMIT 1',
      [file]
    );
    if (applied.length) continue;

    const safeHandler = safeMigrationHandlers.get(file);
    if (safeHandler) {
      await safeHandler(connection);
    } else {
      const sql = await fs.readFile(path.join(migrationsDirectory, file), 'utf8');
      await connection.query(sql);
    }
    await connection.execute('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
    console.log(`Applied database migration: ${file}`);
  }
} finally {
  await connection.end();
}
