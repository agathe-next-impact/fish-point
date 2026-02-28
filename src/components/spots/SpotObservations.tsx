'use client';

import { useQuery } from '@tanstack/react-query';
import { Microscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ObservationCampaign {
  campaign: string;
  date: string;
  speciesCount: number;
  species: Array<{
    name: string;
    scientificName: string | null;
    count: number | null;
    averageWeight: number | null;
    averageLength: number | null;
  }>;
}

async function fetchObservations(spotId: string): Promise<ObservationCampaign[]> {
  const res = await fetch(`/api/spots/${spotId}/observations`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

interface SpotObservationsProps {
  spotId: string;
}

export function SpotObservations({ spotId }: SpotObservationsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['spotObservations', spotId],
    queryFn: () => fetchObservations(spotId),
    staleTime: 3_600_000, // 1 hour (historical data, rarely changes)
  });

  if (isLoading) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Microscope className="h-5 w-5" />
          Observations scientifiques
        </h2>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Microscope className="h-5 w-5" />
        Observations scientifiques
      </h2>
      <div className="space-y-3">
        {data.map((campaign, i) => (
          <div key={i} className="relative pl-6 border-l-2 border-muted pb-3 last:pb-0">
            {/* Timeline dot */}
            <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-primary" />

            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <p className="text-sm font-medium">{campaign.campaign}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(campaign.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {campaign.speciesCount} espèce{campaign.speciesCount > 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1">
              {campaign.species.map((sp, j) => (
                <span
                  key={j}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5"
                  title={sp.scientificName || undefined}
                >
                  {sp.name}
                  {sp.count !== null && sp.count > 0 && (
                    <span className="text-[10px] font-medium">({sp.count})</span>
                  )}
                  {sp.averageLength !== null && (
                    <span className="text-[10px] text-muted-foreground">~{sp.averageLength}cm</span>
                  )}
                  {sp.averageWeight !== null && (
                    <span className="text-[10px] text-muted-foreground">{sp.averageWeight}g</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
