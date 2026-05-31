'use client';

import { MapPin, Check } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  WATER_TYPE_LABELS,
  FISH_CATEGORY_LABELS,
  ACCESS_TYPE_LABELS,
} from '@/lib/constants';
import { DEPARTMENTS } from '@/config/departments';
import { cn } from '@/lib/utils';
import type { GridFilters } from '@/components/spots/SpotGridFilters';
import { EMPTY_FILTERS } from '@/components/spots/SpotGridFilters';

interface FilterRailProps {
  filters: GridFilters;
  onChange: (filters: GridFilters) => void;
  className?: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.04em] text-fs-faint">{children}</p>;
}

export function FilterRail({ filters, onChange, className }: FilterRailProps) {
  const toggleInArray = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const hasActive =
    !!filters.department ||
    filters.waterType.length > 0 ||
    filters.fishCategory.length > 0 ||
    !!filters.accessType ||
    filters.minFishabilityScore !== undefined;

  const minScore = filters.minFishabilityScore ?? 0;

  return (
    <aside className={cn('w-full shrink-0 lg:w-[268px]', className)}>
      <div className="flex items-center justify-between">
        <h2 className="fs-dsp text-lg font-bold text-ink">Filtres</h2>
        {hasActive && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-sm font-semibold text-teal-deep hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="mt-5 space-y-6">
        {/* Département */}
        <div>
          <SectionLabel>Département</SectionLabel>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fs-muted" />
            <select
              value={filters.department || ''}
              onChange={(e) => onChange({ ...filters, department: e.target.value || undefined })}
              className="h-10 w-full rounded-fs-md border border-line bg-card pl-9 pr-3 text-sm text-ink"
            >
              <option value="">Tous les départements</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type d'eau */}
        <div>
          <SectionLabel>Type d&apos;eau</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(WATER_TYPE_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={cn('fs-chip', filters.waterType.includes(key) && 'on')}
                onClick={() => onChange({ ...filters, waterType: toggleInArray(filters.waterType, key) })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Type de poisson */}
        <div>
          <SectionLabel>Type de poisson</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(FISH_CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={cn('fs-chip', filters.fishCategory.includes(key) && 'on')}
                onClick={() => onChange({ ...filters, fishCategory: toggleInArray(filters.fishCategory, key) })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Accès */}
        <div>
          <SectionLabel>Accès</SectionLabel>
          <div className="space-y-1">
            {Object.entries(ACCESS_TYPE_LABELS).map(([key, label]) => {
              const checked = filters.accessType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange({ ...filters, accessType: checked ? undefined : key })}
                  className="flex w-full items-center gap-2.5 py-1 text-left"
                >
                  <span
                    className={cn(
                      'flex h-[19px] w-[19px] items-center justify-center rounded-[6px] border transition-colors',
                      checked ? 'border-primary bg-primary text-white' : 'border-line bg-card',
                    )}
                  >
                    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="text-sm text-ink">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Score minimum */}
        <div>
          <SectionLabel>Score minimum</SectionLabel>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[minScore]}
            onValueChange={([v]) =>
              onChange({
                ...filters,
                minFishabilityScore: v === 0 ? undefined : v,
                maxFishabilityScore: v === 0 ? undefined : 100,
              })
            }
          />
          <div className="mt-2 flex justify-between text-xs font-semibold text-fs-muted">
            <span>0</span>
            <span className="text-teal-deep">{minScore > 0 ? `${minScore}+` : '—'}</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
