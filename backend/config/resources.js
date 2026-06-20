const timestamps = ['created_at', 'updated_at'];

export const resources = {
  users: {
    table: 'users',
    route: 'users',
    columns: ['email', 'password_hash', 'full_name', 'phone', 'role', 'district', 'farm_name', 'land_size', 'crops_grown', 'profile_picture', 'is_active', ...timestamps],
    publicRead: false,
    adminOnlyWrite: true,
    userResource: true
  },
  cropListings: {
    table: 'crop_listings',
    route: 'crop-listings',
    columns: ['crop_name', 'category', 'quantity', 'unit', 'expected_harvest_date', 'expected_price', 'location', 'district', 'description', 'images', 'status', 'farmer_name', 'farmer_id', 'listing_type', ...timestamps],
    json: ['images'],
    publicRead: true,
    ownerFields: ['farmer_id'],
    creatorField: 'farmer_id',
    createRoles: ['farmer'],
    strictCreateRoles: true,
    createDeniedMessage: 'Only farmers can upload crops.'
  },
  bids: {
    table: 'bids',
    route: 'bids',
    columns: ['listing_id', 'buyer_id', 'buyer_name', 'bid_amount', 'quantity_requested', 'message', 'status', 'farmer_id', 'crop_name', ...timestamps],
    publicRead: true,
    ownerFields: ['buyer_id', 'farmer_id'],
    creatorField: 'buyer_id',
    createRoles: ['buyer', 'admin']
  },
  conversations: {
    table: 'conversations',
    route: 'conversations',
    columns: ['participant_ids', 'participant_names', 'subject', 'listing_id', 'listing_name', 'last_message', 'last_message_by', 'last_message_date', ...timestamps],
    json: ['participant_ids', 'participant_names'],
    publicRead: false,
    participantField: 'participant_ids'
  },
  messages: {
    table: 'messages',
    route: 'messages',
    columns: ['conversation_id', 'sender_id', 'receiver_id', 'sender_name', 'content', ...timestamps],
    publicRead: false,
    ownerFields: ['sender_id'],
    creatorField: 'sender_id',
    conversationField: 'conversation_id'
  },
  equipment: {
    table: 'equipment',
    route: 'equipment',
    columns: ['name', 'type', 'description', 'rent_price_per_day', 'sale_price', 'is_for_rent', 'is_for_sale', 'district', 'images', 'owner_id', 'owner_name', 'availability', ...timestamps],
    json: ['images'],
    publicRead: true,
    ownerFields: ['owner_id'],
    creatorField: 'owner_id',
    createRoles: ['equipment_owner', 'admin']
  },
  equipmentBookings: {
    table: 'equipment_bookings',
    route: 'equipment-bookings',
    columns: ['equipment_id', 'equipment_name', 'farmer_id', 'farmer_name', 'owner_id', 'start_date', 'end_date', 'total_cost', 'status', ...timestamps],
    publicRead: false,
    ownerFields: ['farmer_id', 'owner_id'],
    creatorField: 'farmer_id',
    createRoles: ['farmer', 'admin']
  },
  vehicles: {
    table: 'vehicles',
    route: 'vehicles',
    columns: ['vehicle_type', 'capacity', 'price_per_km', 'district', 'description', 'images', 'owner_id', 'owner_name', 'availability', ...timestamps],
    json: ['images'],
    publicRead: true,
    ownerFields: ['owner_id'],
    creatorField: 'owner_id',
    createRoles: ['transport_provider', 'admin']
  },
  transportBookings: {
    table: 'transport_bookings',
    route: 'transport-bookings',
    columns: ['vehicle_id', 'vehicle_type', 'farmer_id', 'farmer_name', 'provider_id', 'pickup_location', 'delivery_location', 'pickup_date', 'estimated_cost', 'status', 'cargo_description', ...timestamps],
    publicRead: false,
    ownerFields: ['farmer_id', 'provider_id'],
    creatorField: 'farmer_id',
    createRoles: ['farmer', 'admin']
  },
  orders: {
    table: 'orders',
    route: 'orders',
    columns: ['buyer_id', 'buyer_name', 'seller_id', 'seller_name', 'items', 'total_amount', 'status', 'delivery_address', 'delivery_district', 'payment_status', ...timestamps],
    json: ['items'],
    publicRead: false,
    ownerFields: ['buyer_id', 'seller_id'],
    creatorField: 'buyer_id',
    createRoles: ['buyer', 'admin']
  },
  products: {
    table: 'products',
    route: 'products',
    columns: ['name', 'category', 'price', 'quantity', 'unit', 'district', 'description', 'images', 'seller_id', 'seller_name', 'status', ...timestamps],
    json: ['images'],
    publicRead: true,
    ownerFields: ['seller_id'],
    creatorField: 'seller_id'
  },
  transactions: {
    table: 'transactions',
    route: 'transactions',
    columns: ['user_id', 'order_id', 'amount', 'type', 'status', 'description', 'counterparty_name', ...timestamps],
    publicRead: false,
    ownerFields: ['user_id'],
    adminOnlyWrite: true
  },
  notifications: {
    table: 'notifications',
    route: 'notifications',
    columns: ['user_id', 'title', 'message', 'type', 'is_read', 'link', ...timestamps],
    publicRead: false,
    ownerFields: ['user_id'],
    creatorField: 'user_id'
  },
  governmentNotices: {
    table: 'government_notices',
    route: 'government-notices',
    columns: ['title', 'category', 'description', 'eligibility', 'deadline', 'link', 'is_active', ...timestamps],
    publicRead: true,
    adminOnlyWrite: true
  },
  marketPrices: {
    table: 'market_prices',
    route: 'market-prices',
    columns: ['crop_name', 'market_name', 'district', 'price', 'unit', 'date', ...timestamps],
    publicRead: true,
    adminOnlyWrite: true
  }
};

export function getResourceByRoute(route) {
  return Object.values(resources).find((resource) => resource.route === route);
}
