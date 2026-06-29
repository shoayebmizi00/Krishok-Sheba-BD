ALTER TABLE crop_listings
  ADD COLUMN total_quantity DECIMAL(12,2) NULL AFTER quantity,
  ADD COLUMN sold_quantity DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER total_quantity,
  ADD COLUMN remaining_quantity DECIMAL(12,2) NULL AFTER sold_quantity;

UPDATE crop_listings
SET total_quantity = quantity,
    remaining_quantity = GREATEST(quantity - sold_quantity, 0)
WHERE total_quantity IS NULL OR remaining_quantity IS NULL;

ALTER TABLE crop_listings
  MODIFY COLUMN total_quantity DECIMAL(12,2) NOT NULL,
  MODIFY COLUMN remaining_quantity DECIMAL(12,2) NOT NULL,
  MODIFY COLUMN status ENUM('active','sold','sold_out','expired','pending') NOT NULL DEFAULT 'active';

ALTER TABLE products
  ADD COLUMN total_quantity DECIMAL(12,2) NULL AFTER quantity,
  ADD COLUMN sold_quantity DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER total_quantity,
  ADD COLUMN remaining_quantity DECIMAL(12,2) NULL AFTER sold_quantity;

UPDATE products
SET total_quantity = quantity,
    remaining_quantity = GREATEST(quantity - sold_quantity, 0)
WHERE total_quantity IS NULL OR remaining_quantity IS NULL;

ALTER TABLE products
  MODIFY COLUMN total_quantity DECIMAL(12,2) NOT NULL,
  MODIFY COLUMN remaining_quantity DECIMAL(12,2) NOT NULL;
