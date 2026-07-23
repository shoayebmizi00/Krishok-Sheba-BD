import crypto from 'node:crypto';
import { pool } from '../config/db.js';

const settings = {
  crop_category: [
    ['rice', 'ধান ও চাল', 'Rice'], ['wheat', 'গম', 'Wheat'],
    ['vegetables', 'শাকসবজি', 'Vegetables'], ['fruits', 'ফল', 'Fruits'],
    ['spices', 'মসলা', 'Spices'], ['pulses', 'ডাল', 'Pulses'],
    ['fish', 'মাছ', 'Fish'], ['other', 'অন্যান্য', 'Other']
  ],
  equipment_category: [
    ['tractor', 'ট্রাক্টর', 'Tractor'], ['harvester', 'হারভেস্টার', 'Harvester'],
    ['power_tiller', 'পাওয়ার টিলার', 'Power tiller'], ['sprayer', 'স্প্রেয়ার', 'Sprayer'],
    ['seeder', 'বীজ বপন যন্ত্র', 'Seeder'], ['pump', 'সেচ পাম্প', 'Irrigation pump'],
    ['other', 'অন্যান্য', 'Other']
  ],
  vehicle_category: [
    ['pickup_van', 'পিকআপ ভ্যান', 'Pickup van'], ['truck', 'ট্রাক', 'Truck'],
    ['mini_truck', 'মিনি ট্রাক', 'Mini truck'], ['three_wheeler', 'তিন চাকার যান', 'Three wheeler']
  ],
  unit: [
    ['kg', 'কেজি', 'Kilogram'], ['ton', 'টন', 'Ton'], ['maund', 'মণ', 'Maund'],
    ['mon', 'মণ', 'Mon'], ['piece', 'টি', 'Piece']
  ],
  payment_method: [
    ['bkash', 'বিকাশ', 'bKash'], ['nagad', 'নগদ', 'Nagad'],
    ['rocket', 'রকেট', 'Rocket'], ['upay', 'উপায়', 'Upay'],
    ['bank_transfer', 'ব্যাংক ট্রান্সফার', 'Bank transfer'],
    ['cash_on_delivery', 'ক্যাশ অন ডেলিভারি', 'Cash on delivery']
  ],
  notice_type: [
    ['notice', 'নোটিশ', 'Notice'], ['subsidy', 'ভর্তুকি', 'Subsidy'],
    ['training', 'প্রশিক্ষণ', 'Training'], ['weather', 'আবহাওয়া', 'Weather'],
    ['market', 'বাজার তথ্য', 'Market information']
  ],
  blog_category: [
    ['farming', 'কৃষিকাজ', 'Farming'], ['success_story', 'সাফল্যের গল্প', 'Success story'],
    ['technology', 'কৃষি প্রযুক্তি', 'Agricultural technology'],
    ['market', 'বাজার', 'Market'], ['other', 'অন্যান্য', 'Other']
  ]
};

const districts = [
  ['dhaka', 'ঢাকা', 'Dhaka'], ['faridpur', 'ফরিদপুর', 'Faridpur'], ['gazipur', 'গাজীপুর', 'Gazipur'],
  ['gopalganj', 'গোপালগঞ্জ', 'Gopalganj'], ['kishoreganj', 'কিশোরগঞ্জ', 'Kishoreganj'],
  ['madaripur', 'মাদারীপুর', 'Madaripur'], ['manikganj', 'মানিকগঞ্জ', 'Manikganj'],
  ['munshiganj', 'মুন্সিগঞ্জ', 'Munshiganj'], ['narayanganj', 'নারায়ণগঞ্জ', 'Narayanganj'],
  ['narsingdi', 'নরসিংদী', 'Narsingdi'], ['rajbari', 'রাজবাড়ী', 'Rajbari'],
  ['shariatpur', 'শরীয়তপুর', 'Shariatpur'], ['tangail', 'টাঙ্গাইল', 'Tangail'],
  ['bandarban', 'বান্দরবান', 'Bandarban'], ['brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 'Brahmanbaria'],
  ['chandpur', 'চাঁদপুর', 'Chandpur'], ['chattogram', 'চট্টগ্রাম', 'Chattogram'],
  ['comilla', 'কুমিল্লা', 'Comilla'], ['cox_bazar', 'কক্সবাজার', "Cox's Bazar"],
  ['feni', 'ফেনী', 'Feni'], ['khagrachhari', 'খাগড়াছড়ি', 'Khagrachhari'],
  ['lakshmipur', 'লক্ষ্মীপুর', 'Lakshmipur'], ['noakhali', 'নোয়াখালী', 'Noakhali'],
  ['rangamati', 'রাঙ্গামাটি', 'Rangamati'], ['bogura', 'বগুড়া', 'Bogura'],
  ['joypurhat', 'জয়পুরহাট', 'Joypurhat'], ['naogaon', 'নওগাঁ', 'Naogaon'],
  ['natore', 'নাটোর', 'Natore'], ['chapainawabganj', 'চাঁপাইনবাবগঞ্জ', 'Chapainawabganj'],
  ['pabna', 'পাবনা', 'Pabna'], ['rajshahi', 'রাজশাহী', 'Rajshahi'],
  ['sirajganj', 'সিরাজগঞ্জ', 'Sirajganj'], ['bagerhat', 'বাগেরহাট', 'Bagerhat'],
  ['chuadanga', 'চুয়াডাঙ্গা', 'Chuadanga'], ['jashore', 'যশোর', 'Jashore'],
  ['jhenaidah', 'ঝিনাইদহ', 'Jhenaidah'], ['khulna', 'খুলনা', 'Khulna'],
  ['kushtia', 'কুষ্টিয়া', 'Kushtia'], ['magura', 'মাগুরা', 'Magura'],
  ['meherpur', 'মেহেরপুর', 'Meherpur'], ['narail', 'নড়াইল', 'Narail'],
  ['satkhira', 'সাতক্ষীরা', 'Satkhira'], ['barguna', 'বরগুনা', 'Barguna'],
  ['barishal', 'বরিশাল', 'Barishal'], ['bhola', 'ভোলা', 'Bhola'],
  ['jhalokati', 'ঝালকাঠি', 'Jhalokati'], ['patuakhali', 'পটুয়াখালী', 'Patuakhali'],
  ['pirojpur', 'পিরোজপুর', 'Pirojpur'], ['habiganj', 'হবিগঞ্জ', 'Habiganj'],
  ['moulvibazar', 'মৌলভীবাজার', 'Moulvibazar'], ['sunamganj', 'সুনামগঞ্জ', 'Sunamganj'],
  ['sylhet', 'সিলেট', 'Sylhet'], ['dinajpur', 'দিনাজপুর', 'Dinajpur'],
  ['gaibandha', 'গাইবান্ধা', 'Gaibandha'], ['kurigram', 'কুড়িগ্রাম', 'Kurigram'],
  ['lalmonirhat', 'লালমনিরহাট', 'Lalmonirhat'], ['nilphamari', 'নীলফামারী', 'Nilphamari'],
  ['panchagarh', 'পঞ্চগড়', 'Panchagarh'], ['rangpur', 'রংপুর', 'Rangpur'],
  ['thakurgaon', 'ঠাকুরগাঁও', 'Thakurgaon'], ['jamalpur', 'জামালপুর', 'Jamalpur'],
  ['mymensingh', 'ময়মনসিংহ', 'Mymensingh'], ['netrokona', 'নেত্রকোনা', 'Netrokona'],
  ['sherpur', 'শেরপুর', 'Sherpur']
];
settings.district = districts;

const client = await pool.getConnection();
let seeded = 0;
try {
  console.log('[seed] PostgreSQL seed starting');
  await client.beginTransaction();
  for (const [group, values] of Object.entries(settings)) {
    for (const [index, [value, labelBn, labelEn]] of values.entries()) {
      await client.execute(
        `INSERT INTO app_settings
          (id,setting_group,value,label_bn,label_en,is_active,sort_order)
         VALUES ($1,$2,$3,$4,$5,TRUE,$6)
         ON CONFLICT (setting_group,value) DO UPDATE SET
           label_bn=EXCLUDED.label_bn,
           label_en=EXCLUDED.label_en,
           is_active=TRUE,
           sort_order=EXCLUDED.sort_order
         RETURNING id`,
        [crypto.randomUUID(), group, value, labelBn, labelEn, index + 1]
      );
      seeded += 1;
    }
  }
  await client.commit();
  console.log(`[seed] PostgreSQL seed complete: ${seeded} configuration values`);
} catch (error) {
  await client.rollback();
  console.error(`[seed] PostgreSQL seed failed (${error.code || 'SEED_FAILED'}): ${error.message}`);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
