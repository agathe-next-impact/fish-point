'use client';

import { RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  WATER_TYPE_LABELS,
  WATER_CATEGORY_LABELS,
  FISH_CATEGORY_LABELS,
  ACCESS_TYPE_LABELS,
} from '@/lib/constants';
import { DEPARTMENTS } from '@/config/departments';

const SCORE_RANGES = [
  { label: '0-20', min: 0, max: 20 },
  { label: '20-40', min: 20, max: 40 },
  { label: '40-60', min: 40, max: 60 },
  { label: '60-80', min: 60, max: 80 },
  { label: '80-100', min: 80, max: 100 },
] as const;

export interface GridFilters {
  department?: string;
  waterType: string[];
  waterCategory?: string;
  fishCategory: string[];
  accessType?: string;
  minFishabilityScore?: number;
  maxFishabilityScore?: number;
}

export const EMPTY_FILTERS: GridFilters = {
  department: undefined,
  waterType: [],
  waterCategory: undefined,
  fishCategory: [],
  accessType: undefined,
  minFishabilityScore: undefined,
  maxFishabilityScore: undefined,
};

interface SpotGridFiltersProps {
  filters: GridFilters;
  onChange: (filters: GridFilters) => void;
}

export function SpotGridFilters({ filters, onChange }: SpotGridFiltersProps) {
  const toggleInArray = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const hasActiveFilters =
    !!filters.department ||
    filters.waterType.length > 0 ||
    !!filters.waterCategory ||
    filters.fishCategory.length > 0 ||
    !!filters.accessType ||
    filters.minFishabilityScore !== undefined;

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Département */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Département</label>
          <select
            value={filters.department || ''}
            onChange={(e) =>
              onChange({ ...filters, department: e.target.value || undefined })
            }
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Tous les départements</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type d'eau */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Type d&apos;eau</label>
          <div className="flex flex-wrap gap-1">
            {Object.entries(WATER_TYPE_LABELS).map(([key, label]) => (
              <Badge
                key={key}
                variant={filters.waterType.includes(key) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() =>
                  onChange({ ...filters, waterType: toggleInArray(filters.waterType, key) })
                }
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Type de poisson */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Type de poisson</label>
          <div className="flex flex-wrap gap-1">
            {Object.entries(FISH_CATEGORY_LABELS).map(([key, label]) => (
              <Badge
                key={key}
                variant={filters.fishCategory.includes(key) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() =>
                  onChange({ ...filters, fishCategory: toggleInArray(filters.fishCategory, key) })
                }
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Catégorie */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Catégorie</label>
          <div className="flex flex-wrap gap-1">
            {Object.entries(WATER_CATEGORY_LABELS).map(([key, label]) => (
              <Badge
                key={key}
                variant={filters.waterCategory === key ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() =>
                  onChange({
                    ...filters,
                    waterCategory: filters.waterCategory === key ? undefined : key,
                  })
                }
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Accès */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Accès</label>
          <div className="flex flex-wrap gap-1">
            {Object.entries(ACCESS_TYPE_LABELS).map(([key, label]) => (
              <Badge
                key={key}
                variant={filters.accessType === key ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() =>
                  onChange({
                    ...filters,
                    accessType: filters.accessType === key ? undefined : key,
                  })
                }
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Score de pêchabilité */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Score</label>
          <div className="flex flex-wrap gap-1">
            {SCORE_RANGES.map((range) => {
              const isActive =
                filters.minFishabilityScore === range.min &&
                filters.maxFishabilityScore === range.max;
              return (
                <Badge
                  key={range.label}
                  variant={isActive ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() =>
                    onChange({
                      ...filters,
                      minFishabilityScore: isActive ? undefined : range.min,
                      maxFishabilityScore: isActive ? undefined : range.max,
                    })
                  }
                >
                  {range.label}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Réinitialiser
          </Button>
        </div>
      )}
    </div>
  );
}
