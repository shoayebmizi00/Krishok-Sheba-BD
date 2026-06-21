import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function BackButton({ fallback = '/', className = '' }) {
  const navigate = useNavigate();

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => window.history.length > 1 ? navigate(-1) : navigate(fallback)}
      className={`gap-2 px-0 text-muted-foreground hover:text-primary hover:bg-transparent ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      পিছনে যান
    </Button>
  );
}
