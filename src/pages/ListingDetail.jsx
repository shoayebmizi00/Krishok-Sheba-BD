import React, { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { MapPin, Calendar, User, ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/constants';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [listing, setListing] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidQty, setBidQty] = useState('');
  const [bidMsg, setBidMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

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
    await apiClient.entities.Bid.create({
      listing_id: id,
      buyer_id: user?.id,
      buyer_name: user?.full_name || 'Anonymous',
      bid_amount: Number(bidAmount),
      quantity_requested: Number(bidQty) || listing.quantity,
      message: bidMsg,
      farmer_id: listing.farmer_id,
      crop_name: listing.crop_name,
      status: 'pending'
    });
    toast({ title: "Bid placed!", description: "The farmer will review your offer." });
    setBidAmount('');
    setBidQty('');
    setBidMsg('');
    const bidData = await apiClient.entities.Bid.filter({ listing_id: id });
    setBids(bidData);
    setSubmitting(false);
  };

  const handleStartChat = async () => {
    if (!user || !listing) return;
    setStartingChat(true);
    const existing = await apiClient.entities.Conversation.list('-created_date', 100);
    const found = existing.find(c => 
      c.listing_id === id && 
      c.participant_ids?.includes(user.id) && 
      c.participant_ids?.includes(listing.farmer_id)
    );
    if (found) {
      window.location.href = `/messages/${found.id}`;
      return;
    }
    const conv = await apiClient.entities.Conversation.create({
      participant_ids: [user.id, listing.farmer_id],
      participant_names: [user.full_name || 'Buyer', listing.farmer_name || 'Farmer'],
      subject: `${listing.crop_name} - ${listing.district}`,
      listing_id: listing.id,
      listing_name: listing.crop_name,
      last_message: '',
      last_message_date: new Date().toISOString()
    });
    window.location.href = `/messages/${conv.id}`;
  };

  if (loading) return <LoadingSpinner />;
  if (!listing) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h2 className="font-heading font-bold text-xl">Listing not found</h2>
      <Link to="/marketplace"><Button variant="outline" className="mt-4">Back to Marketplace</Button></Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Main info */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="h-56 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              {listing.images && listing.images.length > 0 ? (
                <img src={listing.images[0]} alt={listing.crop_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">🌾</span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-heading font-bold text-2xl text-foreground">{listing.crop_name}</h1>
              <StatusBadge status={listing.status} />
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
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-bold text-primary text-lg">{formatCurrency(listing.expected_price)}/{listing.unit || 'kg'}</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="font-bold text-foreground text-lg">{listing.quantity} {listing.unit || 'kg'}</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-bold text-foreground text-lg capitalize">{(listing.listing_type || 'ready').replace('_', '-')}</p>
            </div>
          </div>

          {listing.description && (
            <div>
              <h3 className="font-heading font-semibold text-foreground mb-2">Description</h3>
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
            <h3 className="font-heading font-semibold text-foreground">Place a Bid</h3>
            <div>
              <label className="text-sm text-muted-foreground">Your Offer (৳ per {listing.unit || 'kg'})</label>
              <Input type="number" placeholder="Enter amount" value={bidAmount} onChange={e => setBidAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Quantity ({listing.unit || 'kg'})</label>
              <Input type="number" placeholder={`Max: ${listing.quantity}`} value={bidQty} onChange={e => setBidQty(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Message (optional)</label>
              <Textarea placeholder="Add a note for the farmer..." value={bidMsg} onChange={e => setBidMsg(e.target.value)} className="mt-1" rows={3} />
            </div>
            <Button onClick={handlePlaceBid} disabled={!bidAmount || submitting} className="w-full bg-primary hover:bg-primary/90 gap-2">
              <Send className="w-4 h-4" /> {submitting ? 'Placing...' : 'Place Bid'}
            </Button>
            {user && user.id !== listing.farmer_id && (
              <Button onClick={handleStartChat} disabled={startingChat} variant="outline" className="w-full gap-2">
                <MessageSquare className="w-4 h-4" /> {startingChat ? 'Starting...' : 'Message Farmer'}
              </Button>
            )}
            {!user && (
              <p className="text-xs text-center text-muted-foreground">
                <Link to="/login" className="text-primary underline">Login</Link> to place bids
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
