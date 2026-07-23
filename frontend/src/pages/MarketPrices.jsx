import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatCurrency } from '@/utils/constants';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { TrendingUp } from 'lucide-react';

export default function MarketPrices() {
  const [prices, setPrices] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [priceRows, trendRows] = await Promise.all([
          apiClient.entities.MarketPrice.list('-date', 100),
          apiClient.dashboard.marketPriceTrends()
        ]);
        setPrices(priceRows);
        setTrends(trendRows);
        setSelectedCrop((current) => current || priceRows[0]?.crop_name || '');
      } catch {
        setError('Market price data could not be loaded. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const crops = [...new Set(prices.map(p => p.crop_name))];
  const districts = [...new Set(prices.map((price) => price.district).filter(Boolean))];
  const filteredPrices = prices.filter(p => {
    const matchCrop = p.crop_name === selectedCrop;
    const matchDistrict = !selectedDistrict || selectedDistrict === 'all' || p.district === selectedDistrict;
    return matchCrop && matchDistrict;
  });

  const chartData = filteredPrices.map(p => ({
    name: p.market_name,
    price: p.price
  }));
  const trendData = trends.filter((row) => row.crop_name === selectedCrop);

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="mx-auto max-w-3xl p-8 text-center text-destructive">{error}</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-foreground">বাজার দর তুলনা</h1>
        <p className="text-muted-foreground text-sm mt-1">বিভিন্ন বাজার ও জেলার ফসলের দাম তুলনা করুন</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Select value={selectedCrop} onValueChange={setSelectedCrop}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Select crop" /></SelectTrigger>
          <SelectContent>
            {crops.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Districts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব জেলা</SelectItem>
            {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Price comparison chart */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4">
            {selectedCrop} — Market Comparison
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v) => [`৳${v}/kg`, 'Price']} />
                <Bar dataKey="price" fill="hsl(142, 72%, 29%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Price trend */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Price Trends (6 Months)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v) => [`৳${v}/kg`]} />
                <Line type="monotone" dataKey="price" stroke="hsl(142, 72%, 29%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Price table */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-heading font-semibold text-foreground mb-4">
          {selectedCrop} Prices by Market
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">বাজার</th>
                <th className="pb-3 font-medium text-muted-foreground">জেলা</th>
                <th className="pb-3 font-medium text-muted-foreground">মূল্য</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrices.map((p, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium text-foreground">{p.market_name}</td>
                  <td className="py-3 text-muted-foreground">{p.district}</td>
                  <td className="py-3 font-bold text-primary">{formatCurrency(p.price)}/{p.unit || 'kg'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPrices.length === 0 && (
            <p className="text-center text-muted-foreground py-8">এই নির্বাচনের জন্য কোনো মূল্য তথ্য নেই</p>
          )}
        </div>
      </div>
    </div>
  );
}
