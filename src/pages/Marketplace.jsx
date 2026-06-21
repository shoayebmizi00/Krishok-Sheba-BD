import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Link, useOutletContext } from 'react-router-dom';
import { Search, MapPin, Plus, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DISTRICTS, CROP_CATEGORIES, formatCurrency } from '@/lib/constants';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import SimplePagination from '@/components/shared/SimplePagination';

function CropCard({ crop, type }) {
  return (
    <Link to={`/listing/${crop.id}`} className="block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all group">
      <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative">
        {crop.images && crop.images.length > 0 ? (
          <img src={crop.images[0]} alt={crop.crop_name || crop.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">🌾</span>
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge status={crop.status} />
        </div>
        {type && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
              {type === 'pre_harvest' ? 'Pre-Harvest' : 'Ready'}
            </span>
          </div>
        )}
        {crop.category && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-0.5 rounded-full bg-card/90 text-foreground text-xs font-medium capitalize">
              {crop.category}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
          {crop.crop_name || crop.name}
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="w-3 h-3" /> {crop.district}
        </div>
        {crop.farmer_name && (
          <p className="text-xs text-muted-foreground mt-1">by {crop.farmer_name}</p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div>
            <span className="text-lg font-bold text-primary">{formatCurrency(crop.expected_price || crop.price)}</span>
            <span className="text-xs text-muted-foreground">/{crop.unit || 'kg'}</span>
          </div>
          <span className="text-xs text-muted-foreground">অবশিষ্ট: {Number(crop.remaining_quantity ?? crop.quantity).toLocaleString('bn-BD')} {crop.unit || 'কেজি'}</span>
        </div>
      </div>
    </Link>
  );
}

export default function Marketplace() {
  const { user } = useOutletContext();
  const [listings, setListings] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [listData, prodData] = await Promise.all([
          apiClient.entities.CropListing.list('-created_date', PAGE_SIZE, page),
          apiClient.entities.Product.list('-created_date', PAGE_SIZE, page)
        ]);
        setListings(listData);
        setProducts(prodData);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load marketplace data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  const filterItems = (items, nameField) => {
    return items.filter(item => {
      const name = (item[nameField] || '').toLowerCase();
      const matchesSearch = !search || name.includes(search.toLowerCase()) || (item.district || '').toLowerCase().includes(search.toLowerCase());
      const matchesDistrict = !districtFilter || districtFilter === 'all' || item.district === districtFilter;
      const matchesCategory = !categoryFilter || categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesDistrict && matchesCategory;
    });
  };

  const filteredListings = filterItems(listings, 'crop_name');
  const filteredProducts = filterItems(products, 'name');
  const preHarvest = filteredListings.filter(l => l.listing_type === 'pre_harvest');
  const readyListings = filteredListings.filter(l => l.listing_type !== 'pre_harvest');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">ফসল মার্কেটপ্লেস</h1>
          <p className="text-muted-foreground text-sm mt-1">সারা বাংলাদেশের কৃষকদের সর্বশেষ ফসল দেখুন</p>
        </div>
        {user?.role === 'farmer' && (
          <Link to="/farmer-dashboard/add-listing">
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="w-4 h-4" /> ফসলের তালিকা যোগ করুন
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ফসল বা জেলা খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={districtFilter} onValueChange={setDistrictFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Districts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব জেলা</SelectItem>
            {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব বিভাগ</SelectItem>
            {CROP_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner text="ফসলের বাজার লোড হচ্ছে..." />
      ) : error ? (
        <EmptyState icon={Sprout} title="Marketplace unavailable" description={error} />
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">সব তালিকা</TabsTrigger>
            <TabsTrigger value="pre_harvest">আগাম ফসল</TabsTrigger>
            <TabsTrigger value="ready">বিক্রির জন্য প্রস্তুত</TabsTrigger>
            <TabsTrigger value="products">পণ্য</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {filteredListings.length === 0 ? (
              <EmptyState icon={Sprout} title="No listings yet" description="Be the first to list your crops!" />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredListings.map(l => <CropCard key={l.id} crop={l} type={l.listing_type} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pre_harvest">
            {preHarvest.length === 0 ? (
              <EmptyState icon={Sprout} title="No pre-harvest listings" />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {preHarvest.map(l => <CropCard key={l.id} crop={l} type="pre_harvest" />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ready">
            {readyListings.length === 0 ? (
              <EmptyState icon={Sprout} title="No ready listings" />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {readyListings.map(l => <CropCard key={l.id} crop={l} type="ready" />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="products">
            {filteredProducts.length === 0 ? (
              <EmptyState icon={Sprout} title="No products yet" />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map(p => <CropCard key={p.id} crop={{...p, crop_name: p.name, expected_price: p.price}} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      <SimplePagination page={page} hasNext={listings.length === PAGE_SIZE || products.length === PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
