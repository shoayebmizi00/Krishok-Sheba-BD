export const DISTRICTS = [
  "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh",
  "Comilla", "Gazipur", "Narayanganj", "Bogura", "Jessore", "Dinajpur", "Tangail", "Faridpur",
  "Narsingdi", "Brahmanbaria", "Habiganj", "Kishoreganj", "Cox's Bazar", "Noakhali", "Feni",
  "Lakshmipur", "Chandpur", "Pirojpur", "Satkhira", "Bagerhat", "Jhenaidah", "Kushtia",
  "Meherpur", "Chuadanga", "Narail", "Magura", "Sherpur", "Jamalpur", "Netrokona",
  "Sunamganj", "Moulvibazar", "Pabna", "Sirajganj", "Natore", "Naogaon", "Chapainawabganj",
  "Joypurhat", "Thakurgaon", "Panchagarh", "Nilphamari", "Lalmonirhat", "Kurigram",
  "Gaibandha", "Barguna", "Patuakhali", "Bhola", "Jhalokathi", "Bandarban", "Rangamati",
  "Khagrachhari", "Madaripur", "Shariatpur", "Gopalganj", "Rajbari", "Manikganj", "Munshiganj"
];

export const CROP_CATEGORIES = [
  { value: "rice", label: "Rice (ধান)" },
  { value: "wheat", label: "Wheat (গম)" },
  { value: "vegetables", label: "Vegetables (সবজি)" },
  { value: "fruits", label: "Fruits (ফল)" },
  { value: "spices", label: "Spices (মশলা)" },
  { value: "pulses", label: "Pulses (ডাল)" },
  { value: "fish", label: "Fish (মাছ)" },
  { value: "other", label: "Other (অন্যান্য)" }
];

export const EQUIPMENT_TYPES = [
  { value: "tractor", label: "Tractor (ট্রাক্টর)" },
  { value: "harvester", label: "Harvester (হারভেস্টার)" },
  { value: "power_tiller", label: "Power Tiller (পাওয়ার টিলার)" },
  { value: "sprayer", label: "Sprayer (স্প্রেয়ার)" },
  { value: "seeder", label: "Seeder (সিডার)" },
  { value: "pump", label: "Pump (পাম্প)" },
  { value: "other", label: "Other (অন্যান্য)" }
];

export const VEHICLE_TYPES = [
  { value: "pickup_van", label: "Pickup Van" },
  { value: "truck", label: "Truck" },
  { value: "mini_truck", label: "Mini Truck" },
  { value: "three_wheeler", label: "Three Wheeler" }
];

export const ROLE_LABELS = {
  admin: "Admin",
  farmer: "Farmer (কৃষক)",
  buyer: "Buyer/Vendor (ক্রেতা)",
  equipment_owner: "Equipment Owner (যন্ত্র মালিক)",
  transport_provider: "Transport Provider (পরিবহন)"
};

export const ORDER_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

export const formatCurrency = (amount) => {
  return `৳${Number(amount || 0).toLocaleString('en-BD')}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};