import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { MapPin, Calendar, User, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/utils/constants';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import BackButton from '@/components/shared/BackButton';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidQty, setBidQty] = useState('');
  const [bidMsg, setBidMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const remainingQuantity = Number(listing?.remaining_quantity ?? listing?.quantity ?? 0);
  const soldOut = ['sold', 'sold_out'].includes(listing?.status) || remainingQuantity <= 0;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await apiClient.entities.CropListing.filter({ id });
      if (data.length > 0) {
        setListing(data[0]);
        const bidData = await apiClient.entities.Bid.filter({ listing_id: id });
        setBids(bidData);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handlePlaceBid = async () => {
    if (!bidAmount) return;
    setSubmitting(true);
    try {
      await apiClient.entities.Bid.create({
        listing_id: id,
        buyer_id: user?.id,
        buyer_name: user?.full_name || 'ক্রেতা',
        bid_amount: Number(bidAmount),
        quantity_requested: Number(bidQty) || remainingQuantity,
        message: bidMsg,
        farmer_id: listing.farmer_id,
        crop_name: listing.crop_name,
        status: 'pending'
      });
      toast({ title: "বিড সফলভাবে পাঠানো হয়েছে", description: "কৃষক আপনার প্রস্তাবটি পর্যালোচনা করবেন।" });
      setBidAmount('');
      setBidQty('');
      setBidMsg('');
      setBids(await apiClient.entities.Bid.filter({ listing_id: id }));
    } catch (error) {
      toast({ title: 'বিড পাঠানো যায়নি', description: error.message || 'কিছু ভুল হয়েছে, আবার চেষ্টা করুন', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartChat = async () => {
    if (!user || !listing) return;
    setStartingChat(true);
    try {
      const conv = await apiClient.messaging.createConversation({
        receiver_id: listing.farmer_id,
        related_type: 'listing',
        related_id: listing.id,
        subject: listing.crop_name
      });
      navigate(`/buyer-dashboard/messages/${conv.id}`);
    } catch (error) {
      toast({
        title: 'কথোপকথন শুরু করা যায়নি',
        description: error.message || 'আবার চেষ্টা করুন',
        variant: 'destructive'
      });
      setStartingChat(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!listing) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h2 className="font-heading font-bold text-xl">ফসলের তালিকাটি পাওয়া যায়নি</h2>
      <Link to="/marketplace"><Button variant="outline" className="mt-4">ফসল বাজারে ফিরুন</Button></Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <BackButton fallback="/marketplace" className="mb-6" />

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Main info */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="h-56 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              {listing.images && listing.images.length > 0 ? (
                <img src={listing.images[0]} alt={listing.crop_name} decoding="async" className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">🌾</span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-heading font-bold text-2xl text-foreground">{listing.crop_name}</h1>
              <StatusBadge status={listing.status} />
              {listing.category && (
                <span className="px-2 py-1 rounded-full bg-secondary text-xs font-medium capitalize">
                  {listing.category}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {listing.district}</span>
              <span className="flex items-center gap-1"><User className="w-4 h-4" /> {listing.farmer_name || 'Farmer'}</span>
              {listing.expected_harvest_date && (
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Harvest: {formatDate(listing.expected_harvest_date)}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground">মূল্য</p>
              <p className="font-bold text-primary text-lg">{formatCurrency(listing.expected_price)}/{listing.unit || 'kg'}</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground">অবশিষ্ট পরিমাণ</p>
              <p className="font-bold text-foreground text-lg">{remainingQuantity.toLocaleString('bn-BD')} {listing.unit || 'কেজি'}</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground">তালিকার ধরন</p>
              <p className="font-bold text-foreground text-lg">{listing.listing_type === 'pre_harvest' ? 'আগাম ফসল' : 'বিক্রির জন্য প্রস্তুত'}</p>
            </div>
          </div>

          {listing.description && (
            <div>
              <h3 className="font-heading font-semibold text-foreground mb-2">বিস্তারিত</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Bids list */}
          {bids.length > 0 && (
            <div>
              <h3 className="font-heading font-semibold text-foreground mb-3">Bids ({bids.length})</h3>
              <div className="space-y-3">
                {bids.map(bid => (
                  <div key={bid.id} className="p-4 rounded-xl border border-border flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{bid.buyer_name}</p>
                      <p className="text-xs text-muted-foreground">{bid.message || 'No message'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(bid.bid_amount)}</p>
                      <StatusBadge status={bid.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bid form */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 p-6 rounded-2xl border border-border bg-card space-y-4">
            <h3 className="font-heading font-semibold text-foreground">{soldOut ? 'বিক্রি শেষ' : 'বিড করুন'}</h3>
            <div>
              <label className="text-sm text-muted-foreground">Your Offer (৳ per {listing.unit || 'kg'})</label>
              <Input type="number" placeholder="Enter amount" value={bidAmount} onChange={e => setBidAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Quantity ({listing.unit || 'kg'})</label>
              <Input type="number" placeholder={`Max: ${listing.quantity}`} value={bidQty} onChange={e => setBidQty(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">বার্তা (ঐচ্ছিক)</label>
              <Textarea placeholder="Add a note for the farmer..." value={bidMsg} onChange={e => setBidMsg(e.target.value)} className="mt-1" rows={3} />
            </div>
            {user?.role === 'buyer' && (
              <Button onClick={handlePlaceBid} disabled={soldOut || !bidAmount || submitting || Number(bidQty || remainingQuantity) > remainingQuantity} className="w-full bg-primary hover:bg-primary/90 gap-2">
                <Send className="w-4 h-4" /> {submitting ? 'বিড পাঠানো হচ্ছে...' : soldOut ? 'বিক্রি শেষ' : 'বিড পাঠান'}
              </Button>
            )}
            {user?.role === 'buyer' && user.id !== listing.farmer_id && (
              <Button onClick={handleStartChat} disabled={startingChat} variant="outline" className="w-full gap-2">
                <MessageSquare className="w-4 h-4" /> {startingChat ? 'শুরু হচ্ছে...' : 'কৃষককে বার্তা দিন'}
              </Button>
            )}
            {!user && (
              <p className="text-xs text-center text-muted-foreground">
                বিড করতে <Link to="/login" className="text-primary underline">লগইন করুন</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
