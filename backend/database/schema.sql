CREATE DATABASE IF NOT EXISTS krishok_sheba_bd
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE krishok_sheba_bd;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL DEFAULT '',
  phone VARCHAR(30) NULL,
  role ENUM('admin', 'farmer', 'buyer', 'equipment_owner', 'transport_provider') NOT NULL DEFAULT 'farmer',
  district VARCHAR(100) NULL,
  farm_name VARCHAR(150) NULL,
  land_size DECIMAL(10,2) NULL,
  crops_grown TEXT NULL,
  profile_picture VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  reset_password_token CHAR(64) NULL,
  reset_password_expires DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_district (district),
  INDEX idx_users_reset_token (reset_password_token)
) ENGINE=InnoDB;

CREATE TABLE crop_listings (
  id CHAR(36) PRIMARY KEY,
  crop_name VARCHAR(150) NOT NULL,
  category ENUM('rice', 'vegetables', 'fruits', 'pulses', 'spices', 'fish', 'other') NOT NULL DEFAULT 'other',
  quantity DECIMAL(12,2) NOT NULL,
  unit ENUM('kg', 'ton', 'maund', 'mon') NOT NULL DEFAULT 'kg',
  expected_harvest_date DATE NULL,
  expected_price DECIMAL(12,2) NOT NULL,
  location VARCHAR(255) NULL,
  district VARCHAR(100) NOT NULL,
  description TEXT NULL,
  images JSON NULL,
  status ENUM('active', 'sold', 'expired', 'pending') NOT NULL DEFAULT 'active',
  farmer_name VARCHAR(120) NULL,
  farmer_id CHAR(36) NOT NULL,
  listing_type ENUM('pre_harvest', 'ready') NOT NULL DEFAULT 'ready',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_crop_listings_farmer FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_crop_listings_farmer (farmer_id),
  INDEX idx_crop_listings_status_created (status, created_at),
  INDEX idx_crop_listings_category (category),
  INDEX idx_crop_listings_district_crop (district, crop_name),
  INDEX idx_crop_listings_harvest (expected_harvest_date)
) ENGINE=InnoDB;

CREATE TABLE bids (
  id CHAR(36) PRIMARY KEY,
  listing_id CHAR(36) NOT NULL,
  buyer_id CHAR(36) NOT NULL,
  buyer_name VARCHAR(120) NULL,
  bid_amount DECIMAL(12,2) NOT NULL,
  quantity_requested DECIMAL(12,2) NULL,
  message TEXT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'countered') NOT NULL DEFAULT 'pending',
  farmer_id CHAR(36) NOT NULL,
  crop_name VARCHAR(150) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bids_listing FOREIGN KEY (listing_id) REFERENCES crop_listings(id) ON DELETE CASCADE,
  CONSTRAINT fk_bids_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bids_farmer FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_bids_listing_status (listing_id, status),
  INDEX idx_bids_buyer (buyer_id, created_at),
  INDEX idx_bids_farmer (farmer_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE conversations (
  id CHAR(36) PRIMARY KEY,
  participant_ids JSON NOT NULL,
  participant_names JSON NOT NULL,
  subject VARCHAR(255) NOT NULL,
  listing_id CHAR(36) NULL,
  listing_name VARCHAR(150) NULL,
  last_message TEXT NULL,
  last_message_by CHAR(36) NULL,
  last_message_date DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversations_listing FOREIGN KEY (listing_id) REFERENCES crop_listings(id) ON DELETE SET NULL,
  CONSTRAINT fk_conversations_last_sender FOREIGN KEY (last_message_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_conversations_listing (listing_id),
  INDEX idx_conversations_last_message (last_message_date)
) ENGINE=InnoDB;

CREATE TABLE messages (
  id CHAR(36) PRIMARY KEY,
  conversation_id CHAR(36) NOT NULL,
  sender_id CHAR(36) NOT NULL,
  receiver_id CHAR(36) NOT NULL,
  sender_name VARCHAR(120) NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_conversation_created (conversation_id, created_at),
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_receiver (receiver_id)
) ENGINE=InnoDB;

CREATE TABLE equipment (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('tractor', 'harvester', 'power_tiller', 'sprayer', 'seeder', 'pump', 'other') NOT NULL,
  description TEXT NULL,
  rent_price_per_day DECIMAL(12,2) NULL,
  sale_price DECIMAL(12,2) NULL,
  is_for_rent BOOLEAN NOT NULL DEFAULT TRUE,
  is_for_sale BOOLEAN NOT NULL DEFAULT FALSE,
  district VARCHAR(100) NOT NULL,
  images JSON NULL,
  owner_id CHAR(36) NOT NULL,
  owner_name VARCHAR(120) NULL,
  availability ENUM('available', 'rented', 'maintenance') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_equipment_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_equipment_owner (owner_id),
  INDEX idx_equipment_availability_district (availability, district),
  INDEX idx_equipment_type (type)
) ENGINE=InnoDB;

CREATE TABLE equipment_bookings (
  id CHAR(36) PRIMARY KEY,
  equipment_id CHAR(36) NOT NULL,
  equipment_name VARCHAR(150) NULL,
  farmer_id CHAR(36) NOT NULL,
  farmer_name VARCHAR(120) NULL,
  owner_id CHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_cost DECIMAL(12,2) NULL,
  status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_equipment_bookings_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  CONSTRAINT fk_equipment_bookings_farmer FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_equipment_bookings_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_equipment_booking_dates CHECK (end_date >= start_date),
  INDEX idx_equipment_bookings_equipment_dates (equipment_id, start_date, end_date),
  INDEX idx_equipment_bookings_farmer (farmer_id, created_at),
  INDEX idx_equipment_bookings_owner (owner_id, status)
) ENGINE=InnoDB;

CREATE TABLE vehicles (
  id CHAR(36) PRIMARY KEY,
  vehicle_type ENUM('pickup_van', 'truck', 'mini_truck', 'three_wheeler') NOT NULL DEFAULT 'truck',
  capacity VARCHAR(100) NULL,
  price_per_km DECIMAL(10,2) NULL,
  district VARCHAR(100) NOT NULL,
  description TEXT NULL,
  images JSON NULL,
  owner_id CHAR(36) NOT NULL,
  owner_name VARCHAR(120) NULL,
  availability ENUM('available', 'on_trip', 'maintenance') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicles_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_vehicles_owner (owner_id),
  INDEX idx_vehicles_availability_district (availability, district),
  INDEX idx_vehicles_type (vehicle_type)
) ENGINE=InnoDB;

CREATE TABLE transport_bookings (
  id CHAR(36) PRIMARY KEY,
  vehicle_id CHAR(36) NOT NULL,
  vehicle_type VARCHAR(50) NULL,
  farmer_id CHAR(36) NOT NULL,
  farmer_name VARCHAR(120) NULL,
  provider_id CHAR(36) NOT NULL,
  pickup_location VARCHAR(255) NOT NULL,
  delivery_location VARCHAR(255) NOT NULL,
  pickup_date DATE NULL,
  estimated_cost DECIMAL(12,2) NULL,
  status ENUM('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  cargo_description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transport_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_transport_bookings_farmer FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_transport_bookings_provider FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_transport_bookings_vehicle_date (vehicle_id, pickup_date),
  INDEX idx_transport_bookings_farmer (farmer_id, created_at),
  INDEX idx_transport_bookings_provider (provider_id, status)
) ENGINE=InnoDB;

CREATE TABLE products (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category ENUM('rice', 'wheat', 'vegetables', 'fruits', 'spices', 'pulses', 'fish', 'other') NOT NULL DEFAULT 'other',
  price DECIMAL(12,2) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit ENUM('kg', 'ton', 'maund', 'mon', 'piece') NOT NULL DEFAULT 'kg',
  district VARCHAR(100) NOT NULL,
  description TEXT NULL,
  images JSON NULL,
  seller_id CHAR(36) NOT NULL,
  seller_name VARCHAR(120) NULL,
  status ENUM('available', 'sold_out', 'inactive') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_products_seller (seller_id),
  INDEX idx_products_status_category (status, category),
  INDEX idx_products_district (district)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id CHAR(36) PRIMARY KEY,
  buyer_id CHAR(36) NOT NULL,
  buyer_name VARCHAR(120) NULL,
  seller_id CHAR(36) NOT NULL,
  seller_name VARCHAR(120) NULL,
  items JSON NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  delivery_address VARCHAR(500) NULL,
  delivery_district VARCHAR(100) NULL,
  payment_status ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_orders_buyer (buyer_id, created_at),
  INDEX idx_orders_seller (seller_id, status),
  INDEX idx_orders_payment_status (payment_status)
) ENGINE=InnoDB;

CREATE TABLE transactions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  order_id CHAR(36) NULL,
  amount DECIMAL(12,2) NOT NULL,
  type ENUM('sale', 'purchase', 'rental', 'transport') NOT NULL DEFAULT 'sale',
  status ENUM('completed', 'pending', 'refunded') NOT NULL DEFAULT 'completed',
  description TEXT NULL,
  counterparty_name VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_transactions_user_created (user_id, created_at),
  INDEX idx_transactions_order (order_id),
  INDEX idx_transactions_status_type (status, type)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('bid', 'order', 'delivery', 'notice', 'system') NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read_created (user_id, is_read, created_at)
) ENGINE=InnoDB;

CREATE TABLE government_notices (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category ENUM('notice', 'subsidy', 'loan', 'training', 'scheme') NOT NULL DEFAULT 'notice',
  description TEXT NOT NULL,
  eligibility TEXT NULL,
  deadline DATE NULL,
  link VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_government_notices_active_created (is_active, created_at),
  INDEX idx_government_notices_category_deadline (category, deadline)
) ENGINE=InnoDB;

CREATE TABLE market_prices (
  id CHAR(36) PRIMARY KEY,
  crop_name VARCHAR(150) NOT NULL,
  market_name VARCHAR(150) NOT NULL,
  district VARCHAR(100) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  unit VARCHAR(30) NOT NULL DEFAULT 'kg',
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_market_price_daily (crop_name, market_name, district, unit, date),
  INDEX idx_market_prices_crop_date (crop_name, date),
  INDEX idx_market_prices_district_date (district, date)
) ENGINE=InnoDB;

-- Promote a registered account to administrator after replacing the email:
-- UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
