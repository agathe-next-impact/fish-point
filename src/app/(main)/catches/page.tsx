'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CatchTimeline } from '@/components/catches/CatchTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import type { CatchData } from '@/types/catch';

export default function CatchesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['catches'],
    queryFn: async () => {
      const res = await fetch('/api/catches');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Carnet de prises</h1>
        <Link href="/catches/new">
          <Button><Plus className="h-4 w-4 mr-1" /> Nouvelle prise</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <CatchTimeline catches={data?.data || []} />
      )}
    </div>
  );
}
