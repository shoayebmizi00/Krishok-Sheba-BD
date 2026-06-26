import React from 'react';
import { Package } from 'lucide-react';
import { formatCurrency } from '@/lib/constants';

export default function OrderSummaryCard({ order }) {
  const item = order?.items?.[0] || {};
  const quantity = Number(item.quantity || 1);
  const total = Number(order?.total_amount || 0);
  const deliveryCharge = Number(order?.delivery_charge || order?.delivery_fee || 0);
  const unitPrice = Number(item.price || (quantity ? Math.max(total - deliveryCharge, 0) / quantity : total));

  return (
    <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-b bg-muted/40 px-5 py-4">
        <h3 className="font-heading text-lg font-bold">অর্ডার সারাংশ</h3>
      </div>
      {order ? (
        <div className="p-5">
          <div className="flex gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50">
              {item.image || item.image_url ? (
                <img src={item.image || item.image_url} alt={item.name || 'পণ্য'} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-9 w-9 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{item.name || 'নির্বাচিত পণ্য'}</p>
              <p className="mt-1 text-sm text-muted-foreground">বিক্রেতা: {order.seller_name || 'বিক্রেতা'}</p>
              <p className="mt-1 text-xs text-muted-foreground">অর্ডার #{order.id?.slice(-8)}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">পরিমাণ</span><span>{quantity.toLocaleString('bn-BD')} {item.unit || ''}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ইউনিট মূল্য</span><span>{formatCurrency(unitPrice)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি চার্জ</span><span>{formatCurrency(deliveryCharge)}</span></div>
          </div>
          <div className="mt-5 rounded-lg bg-primary p-4 text-primary-foreground">
            <div className="flex items-center justify-between">
              <span className="font-semibold">মোট পরিমাণ</span>
              <span className="text-2xl font-black">{formatCurrency(total + deliveryCharge)}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="p-5 text-sm text-muted-foreground">পেমেন্টের জন্য একটি অর্ডার নির্বাচন করুন।</p>
      )}
    </section>
  );
}
