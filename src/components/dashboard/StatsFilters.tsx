'use client';

import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import type { DashboardFilters } from '@/services/dashboard.service';

interface Species {
  id: string;
  name: string;
}

interface Spot {
  id: string;
  name: string;
}

interface StatsFiltersProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}

export function StatsFilters({ filters, onChange }: StatsFiltersProps) {
  const { data: speciesData } = useQuery({
    queryKey: ['dashboard-filter-species'],
    queryFn: async (): Promise<Species[]> => {
      const res = await fetch('/api/catches?limit=100');
      if (!res.ok) return [];
      const json = await res.json();
      const speciesMap = new Map<string, string>();
      for (const c of json.data || []) {
        if (c.species?.id && c.species?.name) {
          speciesMap.set(c.species.id, c.species.name);
        }
      }
      return Array.from(speciesMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 600000,
  });

  const { data: spotsData } = useQuery({
    queryKey: ['dashboard-filter-spots'],
    queryFn: async (): Promise<Spot[]> => {
      const res = await fetch('/api/catches?limit=100');
      if (!res.ok) return [];
      const json = await res.json();
      const spotMap = new Map<string, string>();
      for (const c of json.data || []) {
        if (c.spot?.id && c.spot?.name) {
          spotMap.set(c.spot.id, c.spot.name);
        }
      }
      return Array.from(spotMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 600000,
  });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[160px]">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Espece
        </label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={filters.speciesId || ''}
          onChange={(e) =>
            onChange({ ...filters, speciesId: e.target.value || undefined })
          }
        >
          <option value="">Toutes les especes</option>
          {speciesData?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[160px]">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Spot
        </label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={filters.spotId || ''}
          onChange={(e) =>
            onChange({ ...filters, spotId: e.target.value || undefined })
          }
        >
          <option value="">Tous les spots</option>
          {spotsData?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[140px]">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Date de debut
        </label>
        <Input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) =>
            onChange({ ...filters, startDate: e.target.value || undefined })
          }
        />
      </div>

      <div className="min-w-[140px]">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Date de fin
        </label>
        <Input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) =>
            onChange({ ...filters, endDate: e.target.value || undefined })
          }
        />
      </div>
    </div>
  );
}
