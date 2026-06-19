import React from 'react';

export default function StatCard({ icon: Icon, label, value, color = "text-primary", bgColor = "bg-primary/10" }) {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`text-2xl font-heading font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}