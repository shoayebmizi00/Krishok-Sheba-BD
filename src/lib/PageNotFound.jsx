import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold text-primary/25">৪০৪</p>
        <h1 className="mt-4 font-heading text-2xl font-bold">পাতাটি পাওয়া যায়নি</h1>
        <p className="mt-2 text-muted-foreground">আপনি যে ঠিকানাটি খুঁজছেন সেটি সঠিক নয় অথবা পাতাটি সরিয়ে নেওয়া হয়েছে।</p>
        <Button asChild className="mt-6"><Link to="/">হোমে ফিরুন</Link></Button>
      </div>
    </div>
  );
}
