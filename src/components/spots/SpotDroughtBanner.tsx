'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Droplets } from 'lucide-react';

interface SpotDroughtBannerProps {
  spotId: string;
}

interface DroughtInfo {
  level: string;
  label: string;
  fishingImpacted: boolean;
}

export function SpotDroughtBanner({ spotId }: SpotDroughtBannerProps) {
  const [drought, setDrought] = useState<DroughtInfo | null>(null);

  useEffect(() => {
    async function fetchDrought() {
      try {
        const res = await fetch(`/api/spots/${spotId}/score`);
        if (!res.ok) return;
        const body = await res.json();
        const droughtFactor = body.data?.factors?.find(
          (f: { name: string }) => f.name === 'Sécheresse',
        );
        if (droughtFactor) {
          setDrought({
            level: droughtFactor.description,
            label: droughtFactor.description,
            fishingImpacted: droughtFactor.impact === 'negative',
          });
        }
      } catch {
        // Non-critical
      }
    }
    fetchDrought();
  }, [spotId]);

  if (!drought) return null;

  const isCrisis = drought.fishingImpacted;

  return (
    <div
      className={`rounded-lg p-3 mb-4 flex items-center gap-3 ${
        isCrisis
          ? 'bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800'
          : 'bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
      }`}
    >
      {isCrisis ? (
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
      ) : (
        <Droplets className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
      )}
      <div>
        <p className={`text-sm font-semibold ${isCrisis ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
          {drought.label}
        </p>
        {isCrisis && (
          <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
            La pêche peut être restreinte ou interdite dans cette zone. Consultez les arrêtés préfectoraux.
          </p>
        )}
      </div>
    </div>
  );
}
