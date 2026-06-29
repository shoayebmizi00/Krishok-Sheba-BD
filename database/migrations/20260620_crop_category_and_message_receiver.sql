SET @category_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'crop_listings'
    AND column_name = 'category'
);
SET @category_sql = IF(
  @category_exists = 0,
  'ALTER TABLE crop_listings ADD COLUMN category ENUM(''rice'',''vegetables'',''fruits'',''pulses'',''spices'',''fish'',''other'') NOT NULL DEFAULT ''other'' AFTER crop_name, ADD INDEX idx_crop_listings_category (category)',
  'SELECT 1'
);
PREPARE category_statement FROM @category_sql;
EXECUTE category_statement;
DEALLOCATE PREPARE category_statement;

SET @receiver_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'messages'
    AND column_name = 'receiver_id'
);
SET @receiver_sql = IF(
  @receiver_exists = 0,
  'ALTER TABLE messages ADD COLUMN receiver_id CHAR(36) NULL AFTER sender_id, ADD INDEX idx_messages_receiver (receiver_id), ADD CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE receiver_statement FROM @receiver_sql;
EXECUTE receiver_statement;
DEALLOCATE PREPARE receiver_statement;

UPDATE messages AS message
JOIN conversations AS conversation ON conversation.id = message.conversation_id
SET message.receiver_id = CASE
  WHEN JSON_UNQUOTE(JSON_EXTRACT(conversation.participant_ids, '$[0]')) = message.sender_id
    THEN JSON_UNQUOTE(JSON_EXTRACT(conversation.participant_ids, '$[1]'))
  ELSE JSON_UNQUOTE(JSON_EXTRACT(conversation.participant_ids, '$[0]'))
END
WHERE message.receiver_id IS NULL;

SET @receiver_nullable = (
  SELECT is_nullable
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'messages'
    AND column_name = 'receiver_id'
);
SET @receiver_required_sql = IF(
  @receiver_nullable = 'YES',
  'ALTER TABLE messages MODIFY receiver_id CHAR(36) NOT NULL',
  'SELECT 1'
);
PREPARE receiver_required_statement FROM @receiver_required_sql;
EXECUTE receiver_required_statement;
DEALLOCATE PREPARE receiver_required_statement;
