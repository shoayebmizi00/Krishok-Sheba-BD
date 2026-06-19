import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { History } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/constants';

export default function FarmerTransactions() {
  const { user } = useOutletContext();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const data = await apiClient.entities.Transaction.filter({ user_id: user.id }, '-created_date');
      setTransactions(data);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">Transaction History</h2>

      {transactions.length === 0 ? (
        <EmptyState icon={History} title="No transactions" description="Your earnings and transaction records will appear here" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium text-muted-foreground">Date</th>
                <th className="p-3 font-medium text-muted-foreground">Type</th>
                <th className="p-3 font-medium text-muted-foreground">Description</th>
                <th className="p-3 font-medium text-muted-foreground">Amount</th>
                <th className="p-3 font-medium text-muted-foreground">Status</th>
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
