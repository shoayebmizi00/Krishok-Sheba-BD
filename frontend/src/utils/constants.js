export const DISTRICTS = [
  "ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "বরিশাল", "সিলেট", "রংপুর", "ময়মনসিংহ",
  "কুমিল্লা", "গাজীপুর", "নারায়ণগঞ্জ", "বগুড়া", "যশোর", "দিনাজপুর", "টাঙ্গাইল", "ফরিদপুর",
  "নরসিংদী", "ব্রাহ্মণবাড়িয়া", "হবিগঞ্জ", "কিশোরগঞ্জ", "কক্সবাজার", "নোয়াখালী", "ফেনী",
  "লক্ষ্মীপুর", "চাঁদপুর", "পিরোজপুর", "সাতক্ষীরা", "বাগেরহাট", "ঝিনাইদহ", "কুষ্টিয়া",
  "মেহেরপুর", "চুয়াডাঙ্গা", "নড়াইল", "মাগুরা", "শেরপুর", "জামালপুর", "নেত্রকোণা",
  "সুনামগঞ্জ", "মৌলভীবাজার", "পাবনা", "সিরাজগঞ্জ", "নাটোর", "নওগাঁ", "চাঁপাইনবাবগঞ্জ",
  "জয়পুরহাট", "ঠাকুরগাঁও", "পঞ্চগড়", "নীলফামারী", "লালমনিরহাট", "কুড়িগ্রাম",
  "গাইবান্ধা", "বরগুনা", "পটুয়াখালী", "ভোলা", "ঝালকাঠি", "বান্দরবান", "রাঙামাটি",
  "খাগড়াছড়ি", "মাদারীপুর", "শরীয়তপুর", "গোপালগঞ্জ", "রাজবাড়ী", "মানিকগঞ্জ", "মুন্সিগঞ্জ"
];

export const CROP_CATEGORIES = [
  { value: "rice", label: "ধান ও চাল" }, { value: "vegetables", label: "শাকসবজি" },
  { value: "fruits", label: "ফল" }, { value: "spices", label: "মসলা" },
  { value: "pulses", label: "ডাল" }, { value: "fish", label: "মাছ" },
  { value: "other", label: "অন্যান্য" }
];

export const EQUIPMENT_TYPES = [
  { value: "tractor", label: "ট্রাক্টর" }, { value: "harvester", label: "হারভেস্টার" },
  { value: "power_tiller", label: "পাওয়ার টিলার" }, { value: "sprayer", label: "স্প্রেয়ার" },
  { value: "seeder", label: "বীজ বপন যন্ত্র" }, { value: "pump", label: "সেচ পাম্প" },
  { value: "other", label: "অন্যান্য" }
];

export const VEHICLE_TYPES = [
  { value: "pickup_van", label: "পিকআপ ভ্যান" }, { value: "truck", label: "ট্রাক" },
  { value: "mini_truck", label: "মিনি ট্রাক" }, { value: "three_wheeler", label: "তিন চাকার যান" }
];

export const ROLE_LABELS = {
  admin: "সুপার অ্যাডমিন", farmer: "কৃষক", buyer: "ক্রেতা",
  equipment_owner: "যন্ত্রপাতির মালিক", transport_provider: "পরিবহন সেবাদাতা"
};

export const ORDER_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800", delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

export const formatCurrency = (amount) => `৳${Number(amount || 0).toLocaleString('bn-BD')}`;

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
};
