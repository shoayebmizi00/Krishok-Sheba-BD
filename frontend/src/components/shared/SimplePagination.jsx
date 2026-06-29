import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SimplePagination({ page, hasNext, onPageChange }) {
  if (page === 1 && !hasNext) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="mr-1 h-4 w-4" /> আগের
      </Button>
      <span className="text-sm text-muted-foreground">পৃষ্ঠা {page}</span>
      <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
        পরের <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
