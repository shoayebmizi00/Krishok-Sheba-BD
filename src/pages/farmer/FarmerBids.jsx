import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Check, X, Gavel, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/constants';

export default function FarmerBids() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chattingId, setChattingId] = useState(null);

  const load = async () => {
    if (!user) return;
    const data = await apiClient.entities.Bid.filter({ farmer_id: user.id }, '-created_date');
    setBids(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleBidAction = async (bid, status) => {
    await apiClient.entities.Bid.update(bid.id, { status });
    toast({ title: status === 'accepted' ? 'বিড গ্রহণ করা হয়েছে' : 'বিড প্রত্যাখ্যান করা হয়েছে' });
    load();
  };

  const handleMessageBuyer = async (bid) => {
    setChattingId(bid.id);
    try {
      const conv = await apiClient.entities.Conversation.create({
        participant_ids: [user.id, bid.buyer_id],
        listing_id: bid.listing_id
      });
      window.location.href = `/messages/${conv.id}`;
    } catch (error) {
      toast({
        title: 'কথোপকথন শুরু করা যায়নি',
        description: error.message || 'আবার চেষ্টা করুন',
        variant: 'destructive'
      });
      setChattingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">প্রাপ্ত বিড</h2>

      {bids.length === 0 ? (
        <EmptyState icon={Gavel} title="এখনো কোনো বিড নেই" description="ক্রেতারা প্রস্তাব পাঠালে এখানে দেখা যাবে" />
      ) : (
        <div className="space-y-3">
          {bids.map(bid => (
            <div key={bid.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">{bid.crop_name || 'ফসল'}</h3>
                  <p className="text-sm text-muted-foreground">ক্রেতা: {bid.buyer_name} · পরিমাণ: {bid.quantity_requested}</p>
                  {bid.message && <p className="text-xs text-muted-foreground mt-1 italic">"{bid.message}"</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary text-lg">{formatCurrency(bid.bid_amount)}</span>
                  <StatusBadge status={bid.status} />
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                {bid.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => handleBidAction(bid, 'accepted')} className="bg-green-600 hover:bg-green-700 gap-1">
                      <Check className="w-3.5 h-3.5" /> গ্রহণ করুন
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBidAction(bid, 'rejected')} className="text-destructive gap-1">
                      <X className="w-3.5 h-3.5" /> প্রত্যাখ্যান করুন
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleMessageBuyer(bid)} disabled={chattingId === bid.id} className="ml-auto gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> {chattingId === bid.id ? '...' : 'বার্তা দিন'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
