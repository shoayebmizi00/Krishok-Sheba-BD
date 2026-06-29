UPDATE crop_listings
SET status = 'active'
WHERE status IN ('pending', 'approved');

UPDATE equipment
SET approval_status = 'approved'
WHERE approval_status = 'pending';

UPDATE vehicles
SET approval_status = 'approved'
WHERE approval_status = 'pending';

ALTER TABLE crop_listings
  MODIFY COLUMN status ENUM('pending','approved','rejected','active','sold','sold_out','inactive','expired') NOT NULL DEFAULT 'active';

ALTER TABLE equipment
  MODIFY COLUMN approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved';

ALTER TABLE vehicles
  MODIFY COLUMN approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved';
