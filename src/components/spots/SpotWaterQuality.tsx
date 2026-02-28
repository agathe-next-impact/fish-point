'use client';

import { useQuery } from '@tanstack/react-query';
import { Droplets } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface QualityParameter {
  parameter: string;
  label: string;
  value: number;
  unit: string;
  quality: 'good' | 'average' | 'poor';
  measurementDate: string;
}

const QUALITY_STYLES = {
  good: { bar: 'bg-green-500', label: 'Bon', text: 'text-green-700 dark:text-green-400' },
  average: { bar: 'bg-amber-500', label: 'Moyen', text: 'text-amber-700 dark:text-amber-400' },
  poor: { bar: 'bg-red-500', label: 'Mauvais', text: 'text-red-700 dark:text-red-400' },
};

// Approximate percentage for visual bar (0-100)
function getBarPercent(param: string, value: number): number {
  switch (param) {
    case 'dissolved_oxygen': return Math.min(100, (value / 14) * 100);
    case 'ph': return Math.min(100, ((value - 4) / 10) * 100);
    case 'nitrates': return Math.min(100, Math.max(0, 100 - (value / 50) * 100));
    case 'ammonium': return Math.min(100, Math.max(0, 100 - (value / 2) * 100));
    case 'phosphates': return Math.min(100, Math.max(0, 100 - (value / 0.5) * 100));
    default: return 50;
  }
}

interface BiologicalIndex {
  indexType: string;
  value: number;
  qualityClass: string;
  measurementDate: string;
}

interface WaterQualityResponse {
  parameters: QualityParameter[];
  biologicalIndices: BiologicalIndex[];
}

async function fetchWaterQuality(spotId: string): Promise<WaterQualityResponse> {
  const res = await fetch(`/api/spots/${spotId}/water-quality`);
  if (!res.ok) return { parameters: [], biologicalIndices: [] };
  const json = await res.json();
  return {
    parameters: json.data ?? [],
    biologicalIndices: json.biologicalIndices ?? [],
  };
}

const BIO_QUALITY_STYLES: Record<string, { bg: string; text: string }> = {
  'Très bon': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  'Bon': { bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-700 dark:text-lime-400' },
  'Moyen': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  'Médiocre': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  'Mauvais': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
};

interface SpotWaterQualityProps {
  spotId: string;
}

export function SpotWaterQuality({ spotId }: SpotWaterQualityProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['spotWaterQuality', spotId],
    queryFn: () => fetchWaterQuality(spotId),
    staleTime: 600_000,
    refetchInterval: 600_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Qualité de l&apos;eau
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const params = data?.parameters ?? [];
  const bioIndices = data?.biologicalIndices ?? [];

  if (params.length === 0 && bioIndices.length === 0) return null;

  // Find the most recent measurement date
  const latestDate = params.reduce((latest, p) => {
    const d = new Date(p.measurementDate);
    return d > latest ? d : latest;
  }, new Date(0));

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Droplets className="h-5 w-5" />
        Qualité de l&apos;eau
      </h2>
      <div className="rounded-lg border p-4 space-y-3">
        {params.map((param) => {
          const style = QUALITY_STYLES[param.quality];
          const percent = getBarPercent(param.parameter, param.value);
          return (
            <div key={param.parameter}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{param.label}</span>
                <span className={`text-xs font-medium ${style.text}`}>
                  {param.value} {param.unit} — {style.label}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${style.bar}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Biological indices */}
        {bioIndices.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Indices biologiques</p>
            <div className="flex flex-wrap gap-2">
              {bioIndices.map((idx) => {
                const style = BIO_QUALITY_STYLES[idx.qualityClass] ?? BIO_QUALITY_STYLES['Moyen'];
                return (
                  <div key={idx.indexType} className={`rounded px-2.5 py-1.5 ${style.bg}`}>
                    <span className={`text-xs font-semibold ${style.text}`}>{idx.indexType}</span>
                    <span className={`text-xs ml-1.5 ${style.text}`}>{idx.value}/20 — {idx.qualityClass}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {params.length > 0 && (
          <p className="text-xs text-muted-foreground pt-1">
            Dernier relevé : {latestDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>
    </section>
  );
}
