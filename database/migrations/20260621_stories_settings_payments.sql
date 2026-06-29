ALTER TABLE users
  ADD COLUMN bkash_number VARCHAR(30) NULL,
  ADD COLUMN nagad_number VARCHAR(30) NULL,
  ADD COLUMN rocket_number VARCHAR(30) NULL,
  ADD COLUMN upay_number VARCHAR(30) NULL,
  ADD COLUMN bank_name VARCHAR(120) NULL,
  ADD COLUMN bank_account_number VARCHAR(80) NULL,
  ADD COLUMN account_holder_name VARCHAR(120) NULL,
  ADD COLUMN branch_name VARCHAR(120) NULL;

ALTER TABLE orders
  ADD COLUMN bid_id CHAR(36) NULL,
  ADD COLUMN payment_method VARCHAR(50) NULL;

ALTER TABLE transactions
  ADD COLUMN buyer_id CHAR(36) NULL,
  ADD COLUMN seller_id CHAR(36) NULL,
  ADD COLUMN payment_method VARCHAR(50) NULL,
  ADD COLUMN sender_account VARCHAR(100) NULL,
  ADD COLUMN receiver_account VARCHAR(100) NULL,
  ADD COLUMN reference VARCHAR(255) NULL;

ALTER TABLE transactions
  MODIFY COLUMN status ENUM('pending','sent','received','failed','cancelled','completed','refunded') NOT NULL DEFAULT 'pending';

ALTER TABLE notifications
  MODIFY COLUMN type ENUM('bid','order','delivery','notice','message','booking','payment','system') NOT NULL DEFAULT 'system';

CREATE TABLE IF NOT EXISTS stories (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image VARCHAR(500) NULL,
  category VARCHAR(100) NULL,
  district VARCHAR(100) NOT NULL,
  author_id CHAR(36) NOT NULL,
  author_name VARCHAR(120) NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stories_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_stories_status_created (status, created_at),
  INDEX idx_stories_author (author_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS app_settings (
  id CHAR(36) PRIMARY KEY,
  setting_group ENUM('crop_category','equipment_category','vehicle_category','unit','district','payment_method','notice_type','blog_category') NOT NULL,
  value VARCHAR(120) NOT NULL,
  label_bn VARCHAR(120) NOT NULL,
  label_en VARCHAR(120) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_app_settings_group_value (setting_group, value),
  INDEX idx_app_settings_group_active (setting_group, is_active, sort_order)
) ENGINE=InnoDB;
