'use client';

import { useState, useMemo } from 'react';
import { Fish, Weight, Trophy, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatsFilters } from '@/components/dashboard/StatsFilters';
import { CatchesByHourChart } from '@/components/dashboard/CatchesByHourChart';
import { BaitSuccessChart } from '@/components/dashboard/BaitSuccessChart';
import { WeatherCorrelation } from '@/components/dashboard/WeatherCorrelation';
import { ProgressionChart } from '@/components/dashboard/ProgressionChart';
import {
  useCatchesByHour,
  useCatchesByBait,
  useCatchesByWeather,
  useCatchesBySpecies,
  useProgression,
} from '@/hooks/useDashboard';
import type { DashboardFilters } from '@/services/dashboard.service';

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({});

  const { data: hourData, isLoading: hourLoading } = useCatchesByHour(filters);
  const { data: baitData, isLoading: baitLoading } = useCatchesByBait(filters);
  const { data: weatherData, isLoading: weatherLoading } = useCatchesByWeather(filters);
  const { data: speciesData, isLoading: speciesLoading } = useCatchesBySpecies(filters);
  const { data: progressionData, isLoading: progressionLoading } = useProgression(filters);

  const stats = useMemo(() => {
    const totalCatches = speciesData?.reduce((sum, s) => sum + s.count, 0) || 0;

    const biggestFish = speciesData?.reduce<{ weight: number; species: string }>(
      (max, s) => {
        if (s.maxWeight !== null && s.maxWeight > max.weight) {
          return { weight: s.maxWeight, species: s.speciesName };
        }
        return max;
      },
      { weight: 0, species: '-' },
    );

    const mostCaughtSpecies = speciesData?.[0];

    const avgWeight =
      speciesData && speciesData.length > 0
        ? speciesData.reduce((sum, s) => {
            if (s.avgWeight !== null) return sum + s.avgWeight * s.count;
            return sum;
          }, 0) /
          speciesData.reduce((sum, s) => {
            if (s.avgWeight !== null) return sum + s.count;
            return sum;
          }, 0)
        : 0;

    return {
      totalCatches,
      biggestFish: biggestFish?.weight
        ? `${biggestFish.weight}kg`
        : '-',
      biggestFishSubtitle: biggestFish?.weight
        ? biggestFish.species
        : undefined,
      mostCaughtSpecies: mostCaughtSpecies?.speciesName || '-',
      mostCaughtSpeciesSubtitle: mostCaughtSpecies
        ? `${mostCaughtSpecies.count} prise${mostCaughtSpecies.count > 1 ? 's' : ''}`
        : undefined,
      avgWeight: avgWeight ? `${Math.round(avgWeight * 100) / 100}kg` : '-',
    };
  }, [speciesData]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Tableau de bord</h1>

      {/* Stat Cards */}
      {speciesLoading ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-30" />
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total des prises"
            value={stats.totalCatches}
            icon={Fish}
          />
          <StatCard
            title="Plus gros poisson"
            value={stats.biggestFish}
            subtitle={stats.biggestFishSubtitle}
            icon={Trophy}
          />
          <StatCard
            title="Espece favorite"
            value={stats.mostCaughtSpecies}
            subtitle={stats.mostCaughtSpeciesSubtitle}
            icon={Target}
          />
          <StatCard
            title="Poids moyen"
            value={stats.avgWeight}
            icon={Weight}
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <StatsFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {hourLoading ? (
          <Skeleton className="h-100" />
        ) : (
          hourData && <CatchesByHourChart data={hourData} />
        )}

        {baitLoading ? (
          <Skeleton className="h-100" />
        ) : (
          baitData && <BaitSuccessChart data={baitData} />
        )}

        {weatherLoading ? (
          <Skeleton className="h-100" />
        ) : (
          weatherData && <WeatherCorrelation data={weatherData} />
        )}

        {progressionLoading ? (
          <Skeleton className="h-100" />
        ) : (
          progressionData && <ProgressionChart data={progressionData} />
        )}
      </div>
    </div>
  );
}
