ALTER TABLE uploaded_files
  MODIFY COLUMN folder ENUM('crops','equipment','vehicles','profiles','payments') NOT NULL;

ALTER TABLE transactions
  ADD COLUMN transaction_code VARCHAR(40) NULL AFTER id,
  ADD COLUMN sender_number VARCHAR(50) NULL AFTER reference,
  ADD COLUMN receiver_number VARCHAR(50) NULL AFTER sender_number,
  ADD COLUMN sender_bank VARCHAR(120) NULL AFTER receiver_number,
  ADD COLUMN receiver_bank VARCHAR(120) NULL AFTER sender_bank,
  ADD COLUMN transaction_reference VARCHAR(255) NULL AFTER receiver_bank,
  ADD COLUMN screenshot_url VARCHAR(500) NULL AFTER transaction_reference,
  ADD COLUMN note TEXT NULL AFTER screenshot_url,
  MODIFY COLUMN status ENUM('pending','sent','received','verified','failed','cancelled','cod_pending','completed','refunded') NOT NULL DEFAULT 'pending';

UPDATE transactions SET transaction_code=CONCAT('KSB-',UPPER(SUBSTRING(REPLACE(id,'-',''),1,12)))
WHERE transaction_code IS NULL;

ALTER TABLE transactions
  MODIFY COLUMN transaction_code VARCHAR(40) NOT NULL,
  ADD UNIQUE INDEX uq_transactions_code (transaction_code),
  ADD INDEX idx_transactions_buyer_created (buyer_id,created_at),
  ADD INDEX idx_transactions_seller_status_created (seller_id,status,created_at),
  ADD INDEX idx_transactions_method_status (payment_method,status),
  ADD INDEX idx_transactions_created (created_at);

ALTER TABLE orders
  ADD INDEX idx_orders_status_created (status,created_at),
  ADD INDEX idx_orders_seller_created (seller_id,created_at);

ALTER TABLE equipment ADD INDEX idx_equipment_created (created_at);
ALTER TABLE vehicles ADD INDEX idx_vehicles_created (created_at);
