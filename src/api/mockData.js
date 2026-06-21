const now = new Date();
const date = (offsetDays = 0) => {
  const value = new Date(now);
  value.setDate(value.getDate() + offsetDays);
  return value.toISOString().slice(0, 10);
};
const timestamp = (offsetDays = 0) => `${date(offsetDays)}T09:00:00.000Z`;

export const demoUsers = [
  { id: 'user-admin', email: 'admin@example.com', password: '123456', full_name: 'Demo Admin', role: 'admin', district: 'Dhaka', phone: '01700000001', is_active: true },
  { id: 'user-farmer', email: 'farmer@example.com', password: '123456', full_name: 'Abdul Karim', role: 'farmer', district: 'Rajshahi', phone: '01700000002', farm_name: 'Karim Agro Farm', land_size: 8.5, crops_grown: 'Rice, Potato, Tomato', is_active: true },
  { id: 'user-buyer', email: 'buyer@example.com', password: '123456', full_name: 'Nusrat Jahan', role: 'buyer', district: 'Dhaka', phone: '01700000003', is_active: true },
  { id: 'user-equipment', email: 'equipment@example.com', password: '123456', full_name: 'Mehedi Machinery', role: 'equipment_owner', district: 'Bogura', phone: '01700000004', is_active: true },
  { id: 'user-transport', email: 'transport@example.com', password: '123456', full_name: 'Rafiq Transport', role: 'transport_provider', district: 'Jashore', phone: '01700000005', is_active: true }
];

export const mockData = {
  User: demoUsers,
  CropListing: [
    { id: 'crop-rice', crop_name: 'Premium Aman Rice', category: 'rice', quantity: 2500, unit: 'kg', expected_price: 62, district: 'Rajshahi', location: 'Paba, Rajshahi', description: 'Fresh Aman rice grown with reduced pesticide use.', status: 'active', farmer_id: 'user-farmer', farmer_name: 'Abdul Karim', listing_type: 'ready', expected_harvest_date: date(-3), images: [], created_at: timestamp(-2) },
    { id: 'crop-potato', crop_name: 'Diamond Potato', category: 'vegetables', quantity: 4000, unit: 'kg', expected_price: 34, district: 'Rangpur', location: 'Mithapukur, Rangpur', description: 'Well graded potatoes suitable for wholesale orders.', status: 'active', farmer_id: 'user-farmer', farmer_name: 'Abdul Karim', listing_type: 'pre_harvest', expected_harvest_date: date(18), images: [], created_at: timestamp(-4) },
    { id: 'crop-tomato', crop_name: 'Fresh Tomato', category: 'vegetables', quantity: 800, unit: 'kg', expected_price: 48, district: 'Bogura', location: 'Shibganj, Bogura', description: 'Firm, market-ready tomatoes packed in crates.', status: 'active', farmer_id: 'user-farmer', farmer_name: 'Abdul Karim', listing_type: 'ready', expected_harvest_date: date(2), images: [], created_at: timestamp(-1) }
  ],
  Bid: [
    { id: 'bid-1', listing_id: 'crop-rice', buyer_id: 'user-buyer', buyer_name: 'Nusrat Jahan', bid_amount: 59, quantity_requested: 1000, message: 'Can collect from the farm this week.', status: 'pending', farmer_id: 'user-farmer', crop_name: 'Premium Aman Rice', created_at: timestamp(-1) },
    { id: 'bid-2', listing_id: 'crop-potato', buyer_id: 'user-buyer', buyer_name: 'Nusrat Jahan', bid_amount: 32, quantity_requested: 2000, message: 'Interested in a standing order.', status: 'accepted', farmer_id: 'user-farmer', crop_name: 'Diamond Potato', created_at: timestamp(-3) }
  ],
  Product: [
    { id: 'product-lentil', name: 'Cleaned Red Lentil', category: 'pulses', price: 128, quantity: 500, unit: 'kg', district: 'Kushtia', description: 'Cleaned and bagged red lentils.', seller_id: 'user-farmer', seller_name: 'Abdul Karim', status: 'available', images: [], created_at: timestamp(-2) },
    { id: 'product-chili', name: 'Dry Red Chili', category: 'spices', price: 310, quantity: 180, unit: 'kg', district: 'Bogura', description: 'Sun-dried local chili.', seller_id: 'user-farmer', seller_name: 'Abdul Karim', status: 'available', images: [], created_at: timestamp(-5) }
  ],
  Order: [
    { id: 'order-1', buyer_id: 'user-buyer', buyer_name: 'Nusrat Jahan', seller_id: 'user-farmer', seller_name: 'Abdul Karim', items: [{ name: 'Premium Aman Rice', quantity: 500, unit: 'kg' }], total_amount: 31000, status: 'confirmed', delivery_address: 'Karwan Bazar, Dhaka', delivery_district: 'Dhaka', payment_status: 'paid', created_at: timestamp(-4) },
    { id: 'order-2', buyer_id: 'user-buyer', buyer_name: 'Nusrat Jahan', seller_id: 'user-farmer', seller_name: 'Abdul Karim', items: [{ name: 'Diamond Potato', quantity: 1000, unit: 'kg' }], total_amount: 34000, status: 'shipped', delivery_address: 'Jatrabari, Dhaka', delivery_district: 'Dhaka', payment_status: 'pending', created_at: timestamp(-2) }
  ],
  Equipment: [
    { id: 'equipment-tractor', name: 'Mahindra 575 Tractor', type: 'tractor', description: '55 HP tractor with experienced operator available.', rent_price_per_day: 6500, sale_price: null, is_for_rent: true, is_for_sale: false, district: 'Bogura', images: [], owner_id: 'user-equipment', owner_name: 'Mehedi Machinery', availability: 'available', created_at: timestamp(-4) },
    { id: 'equipment-harvester', name: 'Mini Combine Harvester', type: 'harvester', description: 'Compact harvester suitable for rice and wheat fields.', rent_price_per_day: 12000, sale_price: null, is_for_rent: true, is_for_sale: false, district: 'Rajshahi', images: [], owner_id: 'user-equipment', owner_name: 'Mehedi Machinery', availability: 'available', created_at: timestamp(-2) }
  ],
  EquipmentBooking: [
    { id: 'equipment-booking-1', equipment_id: 'equipment-tractor', equipment_name: 'Mahindra 575 Tractor', farmer_id: 'user-farmer', farmer_name: 'Abdul Karim', owner_id: 'user-equipment', start_date: date(3), end_date: date(5), total_cost: 13000, status: 'confirmed', created_at: timestamp(-1) },
    { id: 'equipment-booking-2', equipment_id: 'equipment-harvester', equipment_name: 'Mini Combine Harvester', farmer_id: 'user-farmer', farmer_name: 'Abdul Karim', owner_id: 'user-equipment', start_date: date(10), end_date: date(11), total_cost: 12000, status: 'pending', created_at: timestamp(0) }
  ],
  Vehicle: [
    { id: 'vehicle-truck', vehicle_type: 'truck', capacity: '8 ton', price_per_km: 58, district: 'Jashore', description: 'Covered truck for long-distance crop transport.', images: [], owner_id: 'user-transport', owner_name: 'Rafiq Transport', availability: 'available', created_at: timestamp(-3) },
    { id: 'vehicle-pickup', vehicle_type: 'pickup_van', capacity: '1.5 ton', price_per_km: 32, district: 'Dhaka', description: 'Fast pickup service for city markets.', images: [], owner_id: 'user-transport', owner_name: 'Rafiq Transport', availability: 'available', created_at: timestamp(-1) }
  ],
  TransportBooking: [
    { id: 'transport-booking-1', vehicle_id: 'vehicle-truck', vehicle_type: 'truck', farmer_id: 'user-farmer', farmer_name: 'Abdul Karim', provider_id: 'user-transport', pickup_location: 'Paba, Rajshahi', delivery_location: 'Karwan Bazar, Dhaka', pickup_date: date(4), estimated_cost: 14500, status: 'confirmed', cargo_description: '2.5 tons of bagged rice', created_at: timestamp(-1) },
    { id: 'transport-booking-2', vehicle_id: 'vehicle-pickup', vehicle_type: 'pickup_van', farmer_id: 'user-farmer', farmer_name: 'Abdul Karim', provider_id: 'user-transport', pickup_location: 'Shibganj, Bogura', delivery_location: 'Natore wholesale market', pickup_date: date(2), estimated_cost: 4200, status: 'pending', cargo_description: 'Tomato crates', created_at: timestamp(0) }
  ],
  Transaction: [
    { id: 'transaction-1', user_id: 'user-farmer', order_id: 'order-1', amount: 31000, type: 'sale', status: 'completed', description: 'Rice order payment', counterparty_name: 'Nusrat Jahan', created_at: timestamp(-3) },
    { id: 'transaction-2', user_id: 'user-buyer', order_id: 'order-1', amount: 31000, type: 'purchase', status: 'completed', description: 'Rice purchase', counterparty_name: 'Abdul Karim', created_at: timestamp(-3) },
    { id: 'transaction-3', user_id: 'user-equipment', amount: 13000, type: 'rental', status: 'pending', description: 'Tractor rental', counterparty_name: 'Abdul Karim', created_at: timestamp(-1) },
    { id: 'transaction-4', user_id: 'user-transport', amount: 14500, type: 'transport', status: 'pending', description: 'Rajshahi to Dhaka delivery', counterparty_name: 'Abdul Karim', created_at: timestamp(-1) }
  ],
  Notification: [
    { id: 'notification-1', user_id: 'user-farmer', title: 'New bid received', message: 'Nusrat Jahan placed a bid on Premium Aman Rice.', type: 'bid', is_read: false, link: '/farmer-dashboard/bids', created_at: timestamp(0) },
    { id: 'notification-2', user_id: 'user-buyer', title: 'Bid accepted', message: 'Your bid for Diamond Potato was accepted.', type: 'order', is_read: false, link: '/buyer-dashboard/orders', created_at: timestamp(-1) },
    { id: 'notification-3', user_id: 'user-equipment', title: 'New booking request', message: 'A farmer requested the mini combine harvester.', type: 'system', is_read: false, link: '/equipment-owner-dashboard/bookings', created_at: timestamp(0) },
    { id: 'notification-4', user_id: 'user-transport', title: 'Transport request', message: 'A new tomato delivery request is waiting.', type: 'delivery', is_read: false, link: '/transport-dashboard/bookings', created_at: timestamp(0) },
    { id: 'notification-5', user_id: 'user-admin', title: 'Demo mode active', message: 'The application is using local development data.', type: 'system', is_read: false, link: '/admin', created_at: timestamp(0) }
  ],
  Conversation: [
    { id: 'conversation-1', participant_ids: ['user-farmer', 'user-buyer'], participant_names: ['Abdul Karim', 'Nusrat Jahan'], subject: 'Premium Aman Rice - Rajshahi', listing_id: 'crop-rice', listing_name: 'Premium Aman Rice', last_message: 'I can arrange pickup on Thursday.', last_message_by: 'user-buyer', last_message_date: timestamp(0), created_at: timestamp(-2) }
  ],
  Message: [
    { id: 'message-1', conversation_id: 'conversation-1', sender_id: 'user-buyer', sender_name: 'Nusrat Jahan', content: 'Is 1,000 kg available this week?', created_at: timestamp(-1) },
    { id: 'message-2', conversation_id: 'conversation-1', sender_id: 'user-farmer', sender_name: 'Abdul Karim', content: 'Yes, it is ready and packed.', created_at: timestamp(-1) },
    { id: 'message-3', conversation_id: 'conversation-1', sender_id: 'user-buyer', sender_name: 'Nusrat Jahan', content: 'I can arrange pickup on Thursday.', created_at: timestamp(0) }
  ],
  GovernmentNotice: [
    { id: 'notice-1', title: 'Agricultural Machinery Subsidy 2026', category: 'subsidy', description: 'Eligible farmers can apply for support toward selected agricultural machinery.', eligibility: 'Registered farmers and farmer cooperatives', deadline: date(30), link: 'https://dae.gov.bd', is_active: true, created_at: timestamp(-2) },
    { id: 'notice-2', title: 'Safe Vegetable Production Training', category: 'training', description: 'District-level practical training on safe crop production and post-harvest handling.', eligibility: 'Vegetable farmers', deadline: date(18), link: 'https://dae.gov.bd', is_active: true, created_at: timestamp(-5) },
    { id: 'notice-3', title: 'Seasonal Agriculture Loan Window', category: 'loan', description: 'Short-term agricultural credit is available through participating banks.', eligibility: 'Farmers with national ID and land or tenancy documents', deadline: date(45), link: 'https://www.bb.org.bd', is_active: true, created_at: timestamp(-4) }
  ],
  MarketPrice: [
    { id: 'price-1', crop_name: 'Rice', market_name: 'Karwan Bazar', district: 'Dhaka', price: 68, unit: 'kg', date: date(0), created_at: timestamp(0) },
    { id: 'price-2', crop_name: 'Potato', market_name: 'Shyambazar', district: 'Dhaka', price: 38, unit: 'kg', date: date(0), created_at: timestamp(0) },
    { id: 'price-3', crop_name: 'Tomato', market_name: 'Rajshahi City Market', district: 'Rajshahi', price: 55, unit: 'kg', date: date(0), created_at: timestamp(0) },
    { id: 'price-4', crop_name: 'Onion', market_name: 'Khatunganj', district: 'Chattogram', price: 82, unit: 'kg', date: date(-1), created_at: timestamp(-1) },
    { id: 'price-5', crop_name: 'Red Lentil', market_name: 'Kushtia Market', district: 'Kushtia', price: 134, unit: 'kg', date: date(-1), created_at: timestamp(-1) }
  ],
  Story: [
    { id: 'story-1', title: 'সরাসরি বিক্রিতে ন্যায্য দাম', content: 'কৃষক-সেবা বিডির মাধ্যমে মধ্যস্বত্বভোগী ছাড়াই ধান বিক্রি করে ভালো দাম পেয়েছি। এখন ক্রেতার সঙ্গে সরাসরি কথা বলতে পারি এবং নিজের ফসলের মূল্য নিজেই ঠিক করতে পারি।', category: 'ধান চাষ', district: 'রাজশাহী', author_id: 'user-farmer', author_name: 'আব্দুল করিম', status: 'approved', image: '', created_at: timestamp(-2) }
  ],
  AppSetting: [
    { id: 'setting-1', setting_group: 'payment_method', value: 'bkash', label_bn: 'বিকাশ', label_en: 'bKash', is_active: true, sort_order: 1, created_at: timestamp(-2) },
    { id: 'setting-2', setting_group: 'payment_method', value: 'nagad', label_bn: 'নগদ', label_en: 'Nagad', is_active: true, sort_order: 2, created_at: timestamp(-2) }
  ]
};

export const createMockDatabase = () => structuredClone(mockData);
