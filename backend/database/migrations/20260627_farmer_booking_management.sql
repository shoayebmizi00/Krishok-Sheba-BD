ALTER TABLE equipment_bookings
  ADD COLUMN owner_name VARCHAR(120) NULL AFTER owner_id,
  ADD COLUMN rental_days INT NOT NULL DEFAULT 1 AFTER end_date,
  ADD COLUMN quantity INT NOT NULL DEFAULT 1 AFTER rental_days,
  ADD COLUMN pickup_location VARCHAR(255) NULL AFTER quantity,
  ADD COLUMN notes TEXT NULL AFTER pickup_location,
  MODIFY COLUMN status ENUM('pending','approved','rejected','confirmed','active','completed','cancelled') NOT NULL DEFAULT 'pending';

UPDATE equipment_bookings b
JOIN equipment e ON e.id=b.equipment_id
SET b.owner_name=e.owner_name,
    b.rental_days=GREATEST(DATEDIFF(b.end_date,b.start_date)+1,1)
WHERE b.owner_name IS NULL;

ALTER TABLE transport_bookings
  ADD COLUMN provider_name VARCHAR(120) NULL AFTER provider_id,
  ADD COLUMN preferred_time TIME NULL AFTER pickup_date,
  ADD COLUMN product_name VARCHAR(150) NULL AFTER preferred_time,
  ADD COLUMN quantity VARCHAR(100) NULL AFTER product_name,
  ADD COLUMN additional_instructions TEXT NULL AFTER cargo_description,
  MODIFY COLUMN status ENUM('pending','accepted','rejected','confirmed','in_transit','delivered','completed','cancelled') NOT NULL DEFAULT 'pending';

UPDATE transport_bookings b
JOIN vehicles v ON v.id=b.vehicle_id
SET b.provider_name=v.owner_name
WHERE b.provider_name IS NULL;
