CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email varchar(191) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  full_name varchar(120) NOT NULL DEFAULT '',
  phone varchar(30),
  role text NOT NULL DEFAULT 'farmer' CHECK (role IN ('admin','farmer','buyer','equipment_owner','transport_provider')),
  district varchar(100), farm_name varchar(150), land_size numeric(10,2), crops_grown text,
  profile_picture varchar(500), bkash_number varchar(30), nagad_number varchar(30),
  rocket_number varchar(30), upay_number varchar(30), bank_name varchar(120),
  bank_account_number varchar(80), account_holder_name varchar(120), branch_name varchar(120),
  is_active boolean NOT NULL DEFAULT true,
  reset_password_token char(64), reset_password_expires timestamptz,
  email_verified boolean NOT NULL DEFAULT true,
  email_verification_token char(64), email_verification_expires timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS uploaded_files (
  id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder text NOT NULL CHECK (folder IN ('crops','equipment','vehicles','profiles','payments')),
  original_name varchar(255) NOT NULL, mime_type varchar(100) NOT NULL,
  file_size bigint NOT NULL CHECK (file_size >= 0), file_data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crop_listings (
  id uuid PRIMARY KEY, crop_name varchar(150) NOT NULL, category varchar(100) NOT NULL DEFAULT 'other',
  quantity numeric(12,2) NOT NULL, total_quantity numeric(12,2) NOT NULL,
  sold_quantity numeric(12,2) NOT NULL DEFAULT 0, remaining_quantity numeric(12,2) NOT NULL,
  unit varchar(30) NOT NULL DEFAULT 'kg', expected_harvest_date date,
  expected_price numeric(12,2) NOT NULL, location varchar(255), district varchar(100) NOT NULL,
  description text, images jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','approved','rejected','active','sold','sold_out','inactive','expired')),
  is_featured boolean NOT NULL DEFAULT false, farmer_name varchar(120),
  farmer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_type text NOT NULL DEFAULT 'ready' CHECK (listing_type IN ('pre_harvest','ready')),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY, listing_id uuid NOT NULL REFERENCES crop_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, buyer_name varchar(120),
  bid_amount numeric(12,2) NOT NULL, quantity_requested numeric(12,2), message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled','countered')),
  farmer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, crop_name varchar(150),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY, participant_one_id uuid REFERENCES users(id) ON DELETE CASCADE,
  participant_two_id uuid REFERENCES users(id) ON DELETE CASCADE,
  participant_ids jsonb NOT NULL, participant_names jsonb NOT NULL, subject varchar(255) NOT NULL,
  listing_id uuid REFERENCES crop_listings(id) ON DELETE SET NULL, listing_name varchar(150),
  related_type text CHECK (related_type IN ('listing','bid','order','equipment_booking','transport_booking','user','general')),
  related_id uuid, last_message text, last_message_by uuid REFERENCES users(id) ON DELETE SET NULL,
  last_message_date timestamptz, last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY, conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name varchar(120), content text NOT NULL, message_text text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY, name varchar(150) NOT NULL, type varchar(100) NOT NULL, description text,
  rent_price_per_day numeric(12,2), sale_price numeric(12,2),
  is_for_rent boolean NOT NULL DEFAULT true, is_for_sale boolean NOT NULL DEFAULT false,
  district varchar(100) NOT NULL, images jsonb,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, owner_name varchar(120),
  availability text NOT NULL DEFAULT 'available' CHECK (availability IN ('available','booked','rented','unavailable','inactive','maintenance')),
  approval_status text NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_bookings (
  id uuid PRIMARY KEY, equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  equipment_name varchar(150), farmer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farmer_name varchar(120), owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_name varchar(120), start_date date NOT NULL, end_date date NOT NULL,
  rental_days integer NOT NULL DEFAULT 1, quantity integer NOT NULL DEFAULT 1,
  pickup_location varchar(255), notes text, total_cost numeric(12,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','confirmed','active','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_equipment_booking_dates CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY, vehicle_type varchar(100) NOT NULL DEFAULT 'truck', capacity varchar(100),
  price_per_km numeric(10,2), district varchar(100) NOT NULL, description text, images jsonb,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, owner_name varchar(120),
  availability text NOT NULL DEFAULT 'available' CHECK (availability IN ('available','booked','on_trip','unavailable','inactive','maintenance')),
  approval_status text NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transport_bookings (
  id uuid PRIMARY KEY, vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_type varchar(50), farmer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farmer_name varchar(120), provider_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_name varchar(120), pickup_location varchar(255) NOT NULL,
  delivery_location varchar(255) NOT NULL, pickup_date date, preferred_time time,
  product_name varchar(150), quantity varchar(100), estimated_cost numeric(12,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','confirmed','in_transit','delivered','completed','cancelled')),
  cargo_description text, additional_instructions text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY, name varchar(150) NOT NULL,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('rice','wheat','vegetables','fruits','spices','pulses','fish','other')),
  price numeric(12,2) NOT NULL, quantity numeric(12,2) NOT NULL, total_quantity numeric(12,2) NOT NULL,
  sold_quantity numeric(12,2) NOT NULL DEFAULT 0, remaining_quantity numeric(12,2) NOT NULL,
  unit text NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg','ton','maund','mon','piece')),
  district varchar(100) NOT NULL, description text, images jsonb,
  seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, seller_name varchar(120),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','sold_out','inactive')),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY, buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_name varchar(120), seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_name varchar(120), items jsonb NOT NULL, total_amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  delivery_address varchar(500), delivery_district varchar(100),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded')),
  bid_id uuid UNIQUE, payment_method varchar(50),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY, transaction_code varchar(40) NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL, amount numeric(12,2) NOT NULL,
  type text NOT NULL DEFAULT 'sale' CHECK (type IN ('sale','purchase','rental','transport')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','received','verified','failed','cancelled','cod_pending','completed','refunded')),
  description text, counterparty_name varchar(120), buyer_id uuid, seller_id uuid,
  payment_method varchar(50), sender_account varchar(100), receiver_account varchar(100),
  reference varchar(255), sender_number varchar(50), receiver_number varchar(50),
  sender_bank varchar(120), receiver_bank varchar(120), transaction_reference varchar(255),
  screenshot_url varchar(500), note text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL, message text NOT NULL,
  type text NOT NULL DEFAULT 'system' CHECK (type IN ('bid','order','delivery','notice','message','booking','payment','system')),
  is_read boolean NOT NULL DEFAULT false, link varchar(500),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS government_notices (
  id uuid PRIMARY KEY, title varchar(255) NOT NULL, category varchar(100) NOT NULL DEFAULT 'notice',
  description text NOT NULL, eligibility text, deadline date, link varchar(500),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_prices (
  id uuid PRIMARY KEY, crop_name varchar(150) NOT NULL, market_name varchar(150) NOT NULL,
  district varchar(100) NOT NULL, price numeric(12,2) NOT NULL, unit varchar(30) NOT NULL DEFAULT 'kg',
  date date NOT NULL, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_market_price_daily UNIQUE (crop_name, market_name, district, unit, date)
);

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY, title varchar(255) NOT NULL, content text NOT NULL, image varchar(500),
  category varchar(100), district varchar(100) NOT NULL,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, author_name varchar(120),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY,
  setting_group text NOT NULL CHECK (setting_group IN ('crop_category','equipment_category','vehicle_category','unit','district','payment_method','notice_type','blog_category')),
  value varchar(120) NOT NULL, label_bn varchar(120) NOT NULL, label_en varchar(120),
  is_active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_app_settings_group_value UNIQUE (setting_group, value)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_district ON users(district);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_owner_created ON uploaded_files(owner_id,created_at);
CREATE INDEX IF NOT EXISTS idx_crop_listings_farmer ON crop_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crop_listings_status_created ON crop_listings(status,created_at);
CREATE INDEX IF NOT EXISTS idx_crop_listings_category ON crop_listings(category);
CREATE INDEX IF NOT EXISTS idx_crop_listings_district_crop ON crop_listings(district,crop_name);
CREATE INDEX IF NOT EXISTS idx_crop_listings_harvest ON crop_listings(expected_harvest_date);
CREATE INDEX IF NOT EXISTS idx_bids_listing_status ON bids(listing_id,status);
CREATE INDEX IF NOT EXISTS idx_bids_buyer ON bids(buyer_id,created_at);
CREATE INDEX IF NOT EXISTS idx_bids_farmer ON bids(farmer_id,created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_date);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_one ON conversations(participant_one_id,last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_two ON conversations(participant_two_id,last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_related ON conversations(related_type,related_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants_gin ON conversations USING gin(participant_ids);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id,created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read_created ON messages(receiver_id,is_read,created_at);
CREATE INDEX IF NOT EXISTS idx_equipment_owner ON equipment(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipment_availability_district ON equipment(availability,district);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_bookings_equipment_dates ON equipment_bookings(equipment_id,start_date,end_date);
CREATE INDEX IF NOT EXISTS idx_equipment_bookings_farmer ON equipment_bookings(farmer_id,created_at);
CREATE INDEX IF NOT EXISTS idx_equipment_bookings_owner ON equipment_bookings(owner_id,status);
CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_availability_district ON vehicles(availability,district);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_transport_bookings_vehicle_date ON transport_bookings(vehicle_id,pickup_date);
CREATE INDEX IF NOT EXISTS idx_transport_bookings_farmer ON transport_bookings(farmer_id,created_at);
CREATE INDEX IF NOT EXISTS idx_transport_bookings_provider ON transport_bookings(provider_id,status);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status_category ON products(status,category);
CREATE INDEX IF NOT EXISTS idx_products_district ON products(district);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id,created_at);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id,status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id,created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status_type ON transactions(status,type);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_created ON transactions(buyer_id,created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_status_created ON transactions(seller_id,status,created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_method_status ON transactions(payment_method,status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id,is_read,created_at);
CREATE INDEX IF NOT EXISTS idx_government_notices_active_created ON government_notices(is_active,created_at);
CREATE INDEX IF NOT EXISTS idx_government_notices_category_deadline ON government_notices(category,deadline);
CREATE INDEX IF NOT EXISTS idx_market_prices_crop_date ON market_prices(crop_name,date);
CREATE INDEX IF NOT EXISTS idx_market_prices_district_date ON market_prices(district,date);
CREATE INDEX IF NOT EXISTS idx_stories_status_created ON stories(status,created_at);
CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id,created_at);
CREATE INDEX IF NOT EXISTS idx_app_settings_group_active ON app_settings(setting_group,is_active,sort_order);

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users','crop_listings','bids','conversations','messages','equipment',
    'equipment_bookings','vehicles','transport_bookings','products','orders',
    'transactions','notifications','government_notices','market_prices','stories','app_settings'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 'trg_' || table_name || '_updated_at', table_name);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', 'trg_' || table_name || '_updated_at', table_name);
  END LOOP;
END;
$$;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users','uploaded_files','crop_listings','bids','conversations','messages',
    'equipment','equipment_bookings','vehicles','transport_bookings','products',
    'orders','transactions','notifications','government_notices','market_prices',
    'stories','app_settings'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE %I FROM anon, authenticated', table_name);
  END LOOP;
END;
$$;
