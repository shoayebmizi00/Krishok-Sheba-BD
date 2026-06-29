import React from 'react';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

function formatCalDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours() || 9)}${pad(d.getMinutes() || 0)}00`;
}

export default function AddToCalendar({ title, startDate, endDate, location, description }) {
  const start = formatCalDate(startDate);
  const end = formatCalDate(endDate || startDate);

  if (!start) return null;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
  });
  if (description) params.set('details', description);
  if (location) params.set('location', location);

  const url = `https://calendar.google.com/calendar/render?${params.toString()}`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Button size="sm" variant="outline" className="gap-1">
        <CalendarPlus className="w-3.5 h-3.5" /> Google Calendar
      </Button>
    </a>
  );
}