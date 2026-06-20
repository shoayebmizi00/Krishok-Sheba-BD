CREATE TABLE IF NOT EXISTS uploaded_files (
  id CHAR(36) PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  folder ENUM('crops', 'equipment', 'vehicles', 'profiles') NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT UNSIGNED NOT NULL,
  file_data LONGBLOB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_uploaded_files_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_uploaded_files_owner_created (owner_id, created_at)
) ENGINE=InnoDB;
