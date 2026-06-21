import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Banknote } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/constants';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await apiClient.entities.Transaction.list('-created_date', 100);
      setTransactions(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">সব লেনদেন</h2>

      {transactions.length === 0 ? (
        <EmptyState icon={Banknote} title="No transactions" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium text-muted-foreground">তারিখ</th>
                <th className="p-3 font-medium text-muted-foreground">ধরন</th>
                <th className="p-3 font-medium text-muted-foreground">বিবরণ</th>
                <th className="p-3 font-medium text-muted-foreground">টাকার পরিমাণ</th>
                <th className="p-3 font-medium text-muted-foreground">অবস্থা</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-3 text-muted-foreground">{formatDate(t.created_date)}</td>
                  <td className="p-3 capitalize text-foreground">{t.type}</td>
                  <td className="p-3 text-muted-foreground">{t.description || '-'}</td>
                  <td className="p-3 font-medium text-primary">{formatCurrency(t.amount)}</td>
                  <td className="p-3"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
