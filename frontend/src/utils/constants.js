export const ROLE_LABELS = {
  admin: 'সুপার অ্যাডমিন',
  farmer: 'কৃষক',
  buyer: 'ক্রেতা',
  equipment_owner: 'যন্ত্রপাতির মালিক',
  transport_provider: 'পরিবহন সেবাদাতা'
};

export const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export const formatCurrency = (amount) => `৳${Number(amount || 0).toLocaleString('bn-BD')}`;

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
