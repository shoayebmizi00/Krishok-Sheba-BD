ALTER TABLE conversations
  ADD COLUMN participant_one_id CHAR(36) NULL AFTER id,
  ADD COLUMN participant_two_id CHAR(36) NULL AFTER participant_one_id,
  ADD COLUMN related_type ENUM('listing','bid','order','equipment_booking','transport_booking','user') NULL AFTER listing_name,
  ADD COLUMN related_id CHAR(36) NULL AFTER related_type,
  ADD COLUMN last_message_at DATETIME NULL AFTER last_message_date,
  ADD INDEX idx_conversations_participant_one (participant_one_id,last_message_at),
  ADD INDEX idx_conversations_participant_two (participant_two_id,last_message_at),
  ADD INDEX idx_conversations_related (related_type,related_id);

UPDATE conversations
SET participant_one_id=JSON_UNQUOTE(JSON_EXTRACT(participant_ids,'$[0]')),
    participant_two_id=JSON_UNQUOTE(JSON_EXTRACT(participant_ids,'$[1]')),
    related_type=IF(listing_id IS NULL,NULL,'listing'),
    related_id=listing_id,
    last_message_at=COALESCE(last_message_date,updated_at);

ALTER TABLE conversations
  ADD CONSTRAINT fk_conversations_participant_one FOREIGN KEY (participant_one_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_conversations_participant_two FOREIGN KEY (participant_two_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages
  ADD COLUMN message_text TEXT NULL AFTER content,
  ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE AFTER message_text,
  ADD INDEX idx_messages_receiver_read_created (receiver_id,is_read,created_at);

UPDATE messages SET message_text=content WHERE message_text IS NULL;
