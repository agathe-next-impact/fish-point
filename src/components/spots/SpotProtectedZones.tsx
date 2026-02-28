'use client';

import { useQuery } from '@tanstack/react-query';
import { Shield, Leaf, Bird, Bug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SpotProtectedZonesProps {
  spotId: string;
}

interface ProtectedZone {
  type: 'natura2000_sic' | 'natura2000_zps' | 'nature_reserve' | 'biotope';
  name: string;
  code: string;
  typeLabel: string;
}

interface ProtectedZonesResponse {
  zones: ProtectedZone[];
  isProtected: boolean;
  isNatura2000: boolean;
  label: string;
}

async function fetchProtectedZones(spotId: string): Promise<ProtectedZonesResponse | null> {
  const res = await fetch(`/api/spots/${spotId}/protected-zones`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

const ZONE_ICONS: Record<string, typeof Shield> = {
  natura2000_sic: Leaf,
  natura2000_zps: Bird,
  nature_reserve: Shield,
  biotope: Bug,
};

const ZONE_COLORS: Record<string, string> = {
  natura2000_sic: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  natura2000_zps: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  nature_reserve: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  biotope: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export function SpotProtectedZones({ spotId }: SpotProtectedZonesProps) {
  const { data } = useQuery({
    queryKey: ['protectedZones', spotId],
    queryFn: () => fetchProtectedZones(spotId),
    staleTime: 86_400_000, // 24h (zones don't change)
  });

  if (!data || data.zones.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Shield className="h-5 w-5 text-emerald-600" />
        Zones protégées
      </h2>
      <div className="space-y-2">
        {data.zones.map((zone) => {
          const Icon = ZONE_ICONS[zone.type] || Shield;
          const colorClass = ZONE_COLORS[zone.type] || 'bg-gray-100 text-gray-800';
          return (
            <div
              key={`${zone.type}-${zone.code}`}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <div className={`rounded-full p-1.5 ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{zone.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">
                    {zone.typeLabel}
                  </Badge>
                  {zone.code && (
                    <span className="text-[10px] text-muted-foreground">{zone.code}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Réglementations spécifiques possibles — vérifiez les arrêtés locaux.
      </p>
    </section>
  );
}
