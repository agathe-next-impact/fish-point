import { Ruler, Weight, Thermometer, Calendar, Utensils, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FISH_CATEGORY_LABELS, ABUNDANCE_LABELS } from '@/lib/constants';
import type { SpotSpeciesData } from '@/types/spot';

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const FEEDING_LABELS: Record<string, string> = {
  carnivore: 'Carnivore',
  omnivore: 'Omnivore',
  herbivore: 'Herbivore',
};

const CATEGORY_COLORS: Record<string, string> = {
  CARNIVORE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  SALMONID: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  CYPRINID: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  CATFISH: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  MARINE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
};

function formatSpawnPeriod(start: number, end: number): string {
  return `${MONTH_NAMES[start - 1]} – ${MONTH_NAMES[end - 1]}`;
}

interface SpotSpeciesCardProps {
  species: SpotSpeciesData;
}

export function SpotSpeciesCard({ species }: SpotSpeciesCardProps) {
  const hasDetails = species.maxLengthCm || species.maxWeightKg || species.optimalTempMin || species.feedingType || species.spawnMonthStart;

  return (
    <div className="rounded-lg border p-3 space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{species.name}</p>
          {species.scientificName && (
            <p className="text-xs text-muted-foreground italic truncate">{species.scientificName}</p>
          )}
        </div>
        <Badge className={`shrink-0 text-[10px] ${CATEGORY_COLORS[species.category] || ''}`}>
          {FISH_CATEGORY_LABELS[species.category] || species.category}
        </Badge>
      </div>

      {/* Abundance */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Abondance :</span>
        <span className="text-xs font-medium">{ABUNDANCE_LABELS[species.abundance]}</span>
      </div>

      {/* Details grid */}
      {hasDetails && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {(species.maxLengthCm || species.maxWeightKg) && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Ruler className="h-3 w-3 shrink-0" />
              <span>
                {species.maxLengthCm && `${species.maxLengthCm} cm`}
                {species.maxLengthCm && species.maxWeightKg && ' / '}
                {species.maxWeightKg && `${species.maxWeightKg} kg`}
              </span>
            </div>
          )}

          {species.optimalTempMin !== null && species.optimalTempMax !== null && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Thermometer className="h-3 w-3 shrink-0" />
              <span>{species.optimalTempMin}–{species.optimalTempMax}°C</span>
            </div>
          )}

          {species.feedingType && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Utensils className="h-3 w-3 shrink-0" />
              <span>{FEEDING_LABELS[species.feedingType] || species.feedingType}</span>
            </div>
          )}

          {species.spawnMonthStart !== null && species.spawnMonthEnd !== null && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{formatSpawnPeriod(species.spawnMonthStart, species.spawnMonthEnd)}</span>
            </div>
          )}

          {species.minLegalSize !== null && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Scale className="h-3 w-3 shrink-0" />
              <span>Taille légale : {species.minLegalSize} cm</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
