'use client';

import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useMapStore } from '@/store/map.store';
import { WATER_TYPE_LABELS, FISHING_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function MapFilters() {
  const filters = useMapStore((s) => s.filters);
  const setFilters = useMapStore((s) => s.setFilters);
  const resetFilters = useMapStore((s) => s.resetFilters);
  const isFiltersOpen = useMapStore((s) => s.isFiltersOpen);
  const setFiltersOpen = useMapStore((s) => s.setFiltersOpen);

  const activeFilterCount =
    filters.waterTypes.length +
    filters.fishingTypes.length +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.minFishabilityScore > 0 ? 1 : 0) +
    (!filters.showAutoDiscovered ? 1 : 0) +
    (filters.pmr ? 1 : 0) +
    (filters.nightFishing ? 1 : 0) +
    (filters.premiumOnly ? 1 : 0);

  const toggleWaterType = (type: string) => {
    const current = filters.waterTypes;
    setFilters({
      waterTypes: current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    });
  };

  const toggleFishingType = (type: string) => {
    const current = filters.fishingTypes;
    setFilters({
      fishingTypes: current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="absolute bottom-24 left-3 z-10 gap-2 bg-background/95 shadow-md backdrop-blur lg:bottom-4 sm:left-4"
        onClick={() => setFiltersOpen(!isFiltersOpen)}
        aria-expanded={isFiltersOpen}
      >
        <Filter className="h-4 w-4" />
        Filtres
        {activeFilterCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </Button>

      <div
        className={cn(
          'absolute left-0 top-0 z-20 h-full w-[min(22rem,calc(100vw-2rem))] overflow-y-auto border-r bg-background/98 shadow-xl transition-transform duration-300',
          isFiltersOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Filtres</h3>
              <p className="text-xs text-muted-foreground">{activeFilterCount} actif{activeFilterCount > 1 ? 's' : ''}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setFiltersOpen(false)} aria-label="Fermer les filtres">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Rayon : {(filters.radius / 1000).toFixed(0)} km
              </label>
              <Slider
                value={[filters.radius]}
                onValueChange={([v]) => setFilters({ radius: v })}
                min={1000}
                max={100000}
                step={1000}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type d&apos;eau</label>
              <div className="flex flex-wrap gap-1">
                {Object.entries(WATER_TYPE_LABELS).map(([key, label]) => (
                  <Badge
                    key={key}
                    variant={filters.waterTypes.includes(key) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleWaterType(key)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type de pêche</label>
              <div className="flex flex-wrap gap-1">
                {Object.entries(FISHING_TYPE_LABELS).map(([key, label]) => (
                  <Badge
                    key={key}
                    variant={filters.fishingTypes.includes(key) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleFishingType(key)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Note minimale : {filters.minRating}/5
              </label>
              <Slider
                value={[filters.minRating]}
                onValueChange={([v]) => setFilters({ minRating: v })}
                min={0}
                max={5}
                step={0.5}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Score fishabilité min. : {filters.minFishabilityScore}/100
              </label>
              <Slider
                value={[filters.minFishabilityScore]}
                onValueChange={([v]) => setFilters({ minFishabilityScore: v })}
                min={0}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.premiumOnly}
                  onChange={(e) => setFilters({ premiumOnly: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Spots premium</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.pmr}
                  onChange={(e) => setFilters({ pmr: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Accessible PMR</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.nightFishing}
                  onChange={(e) => setFilters({ nightFishing: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Pêche de nuit</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showAutoDiscovered}
                  onChange={(e) => setFilters({ showAutoDiscovered: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Spots auto-découverts</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters} className="flex-1">
                Réinitialiser
              </Button>
              <Button size="sm" onClick={() => setFiltersOpen(false)} className="flex-1">
                Appliquer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
