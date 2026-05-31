'use client';

import Link from 'next/link';
import { Plus, Fish, Trophy, Sparkles } from 'lucide-react';
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

  const catches: CatchData[] = data?.data || [];
  const count = catches.length;
  const recordKg = catches.reduce((max, c) => Math.max(max, c.weight ? c.weight / 1000 : 0), 0);
  const speciesCount = new Set(catches.map((c) => c.species.name)).size;
  const year = new Date().getFullYear();

  const stats = [
    { icon: Fish, value: String(count), label: 'Prises' },
    { icon: Trophy, value: recordKg > 0 ? `${recordKg.toFixed(1)} kg` : '—', label: 'Record' },
    { icon: Sparkles, value: String(speciesCount), label: 'Espèces' },
  ];

  return (
    <div className="container mx-auto px-4 py-7">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="fs-dsp text-[2rem] font-extrabold text-ink">Mes prises</h1>
          <p className="mt-1 text-sm text-fs-muted">
            Saison {year} · {count} prise{count > 1 ? 's' : ''} enregistrée{count > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/catches/new">
          <Button>
            <Plus className="h-4 w-4" /> Nouvelle prise
          </Button>
        </Link>
      </div>

      <div className="mb-7 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-fs-lg border border-line bg-card p-4 text-center shadow-fs-sm">
            <stat.icon className="mx-auto mb-1.5 h-5 w-5 text-fs-accent" strokeWidth={1.9} />
            <p className="fs-dsp text-2xl font-extrabold text-ink">{stat.value}</p>
            <p className="text-xs text-fs-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-fs-lg" />
          ))}
        </div>
      ) : (
        <CatchTimeline catches={catches} />
      )}
    </div>
  );
}
