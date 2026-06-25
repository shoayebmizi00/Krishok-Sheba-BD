export function validateOrderCreation({ user, bid, listing, quantity, cropListingId }) {
  if (!user) return { status: 401, message: 'লগইন প্রয়োজন' };
  if (user.role !== 'buyer') return { status: 403, message: 'শুধু ক্রেতা অর্ডার তৈরি করতে পারবেন' };
  if (!bid) return { status: 404, message: 'বিড পাওয়া যায়নি' };
  if (bid.buyer_id !== user.id) return { status: 403, message: 'এই বিড থেকে অর্ডার করার অনুমতি নেই' };
  if (bid.status !== 'accepted') return { status: 400, message: 'শুধু গ্রহণ করা বিড থেকে অর্ডার করা যাবে' };
  if (!listing) return { status: 404, message: 'ফসলের তালিকা পাওয়া যায়নি' };
  if (cropListingId && cropListingId !== listing.id) {
    return { status: 400, message: 'বিড ও ফসলের তালিকার তথ্য মিলছে না' };
  }
  if (listing.status !== 'active' || Number(listing.remaining_quantity) <= 0) {
    return { status: 409, message: 'এই ফসলটি বিক্রি শেষ' };
  }
  if (!Number.isFinite(quantity) || quantity <= 0) return { status: 400, message: 'সঠিক পরিমাণ দিন' };
  if (quantity > Number(listing.remaining_quantity)) return { status: 409, message: 'পর্যাপ্ত পরিমাণ ফসল নেই' };
  if (Number(bid.quantity_requested) > 0 && quantity > Number(bid.quantity_requested)) {
    return { status: 400, message: 'গৃহীত বিডের পরিমাণের বেশি অর্ডার করা যাবে না' };
  }
  return null;
}
