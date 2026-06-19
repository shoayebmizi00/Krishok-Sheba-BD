import React from 'react';

const STATUS_STYLES = {
  active: "bg-green-100 text-green-700",
  available: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  in_transit: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
  accepted: "bg-green-100 text-green-700",
  sold: "bg-gray-100 text-gray-700",
  expired: "bg-gray-100 text-gray-700",
  sold_out: "bg-gray-100 text-gray-700",
  rented: "bg-blue-100 text-blue-700",
  maintenance: "bg-orange-100 text-orange-700",
  on_trip: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  refunded: "bg-red-100 text-red-700",
  countered: "bg-indigo-100 text-indigo-700",
  inactive: "bg-gray-100 text-gray-700",
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {(status || '').replace(/_/g, ' ')}
    </span>
  );
}