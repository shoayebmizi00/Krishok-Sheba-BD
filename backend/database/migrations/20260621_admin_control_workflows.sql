ALTER TABLE crop_listings
  ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE AFTER status,
  MODIFY COLUMN status ENUM('pending','approved','rejected','active','sold','sold_out','inactive','expired') NOT NULL DEFAULT 'pending';

ALTER TABLE bids
  MODIFY COLUMN status ENUM('pending','accepted','rejected','cancelled','countered') NOT NULL DEFAULT 'pending';

ALTER TABLE orders
  MODIFY COLUMN status ENUM('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending';

ALTER TABLE transactions
  MODIFY COLUMN status ENUM('pending','sent','received','verified','failed','cancelled','completed','refunded') NOT NULL DEFAULT 'pending';

ALTER TABLE equipment
  ADD COLUMN approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER availability,
  MODIFY COLUMN availability ENUM('available','booked','rented','unavailable','inactive','maintenance') NOT NULL DEFAULT 'available';

UPDATE equipment SET approval_status = 'approved';

ALTER TABLE vehicles
  ADD COLUMN approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER availability,
  MODIFY COLUMN availability ENUM('available','booked','on_trip','unavailable','inactive','maintenance') NOT NULL DEFAULT 'available';

UPDATE vehicles SET approval_status = 'approved';

ALTER TABLE stories
  ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE AFTER status;
