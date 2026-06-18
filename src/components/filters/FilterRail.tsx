'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Check, LocateFixed, Loader2, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  WATER_TYPE_LABELS,
  FISH_CATEGORY_LABELS,
  ACCESS_TYPE_LABELS,
} from '@/lib/constants';
import {
  FISHING_MODE_OPTIONS,
  FISHING_TECHNIQUE_OPTIONS,
} from '@/lib/fishing-type-classification';
import { DEPARTMENTS } from '@/config/departments';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';
import type { GridFilters, SpeciesPick } from '@/components/spots/SpotGridFilters';
import { EMPTY_FILTERS } from '@/components/spots/SpotGridFilters';

interface FilterRailProps {
  filters: GridFilters;
  onChange: (filters: GridFilters) => void;
  className?: string;
}

/** Rayons proposés pour « autour de moi » (mètres). */
const RADIUS_OPTIONS: ReadonlyArray<{ label: string; value: number }> = [
  { label: '10 km', value: 10000 },
  { label: '30 km', value: 30000 },
  { label: '50 km', value: 50000 },
  { label: '100 km', value: 100000 },
];

const PHYSICAL_ACCESS_OPTIONS: ReadonlyArray<{
  key: 'parking' | 'boatLaunch' | 'pmr' | 'nightFishing';
  label: string;
}> = [
  { key: 'parking', label: 'Parking à proximité' },
  { key: 'boatLaunch', label: 'Mise à l’eau' },
  { key: 'pmr', label: 'Accès PMR' },
  { key: 'nightFishing', label: 'Pêche de nuit autorisée' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.04em] text-fs-faint">
      {children}
    </p>
  );
}

interface SpeciesResult {
  id: string;
  name: string;
  scientificName: string | null;
}

/** Autocomplete multi-espèces adossé à /api/species/search (relation SpotSpecies). */
function SpeciesPicker({
  selected,
  onChange,
}: {
  selected: SpeciesPick[];
  onChange: (next: SpeciesPick[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SpeciesResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setOptions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/species/search?q=${encodeURIComponent(trimmed)}&limit=8`,
          { signal: controller.signal },
        );
        if (res.ok) {
          const json: { data: SpeciesResult[] } = await res.json();
          setOptions(json.data);
        }
      } catch {
        // requête annulée ou réseau : on garde les options précédentes
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selectedIds = new Set(selected.map((s) => s.id));

  const add = (s: SpeciesResult) => {
    if (!selectedIds.has(s.id)) onChange([...selected, { id: s.id, name: s.name }]);
    setQuery('');
    setOptions([]);
    setOpen(false);
  };

  const remove = (id: string) => onChange(selected.filter((s) => s.id !== id));

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor="species-filter" className="sr-only">
        Rechercher une espèce
      </label>
      <input
        id="species-filter"
        type="text"
        role="combobox"
        aria-expanded={open && options.length > 0}
        aria-autocomplete="list"
        aria-controls="species-filter-list"
        placeholder="Brochet, truite, sandre…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="h-10 w-full rounded-fs-md border border-line bg-card px-3 text-sm text-ink placeholder:text-fs-muted"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-fs-muted" />
      )}

      {open && options.length > 0 && (
        <ul
          id="species-filter-list"
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-fs-md border border-line bg-card py-1 shadow-fs-sm"
        >
          {options.map((s) => (
            <li key={s.id} role="option" aria-selected={selectedIds.has(s.id)}>
              <button
                type="button"
                onClick={() => add(s)}
                disabled={selectedIds.has(s.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-muted disabled:opacity-50"
              >
                <span>{s.name}</span>
                {s.scientificName && (
                  <span className="truncate text-xs italic text-fs-muted">{s.scientificName}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Espèces sélectionnées">
          {selected.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => remove(s.id)}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white"
                aria-label={`Retirer ${s.name}`}
              >
                {s.name}
                <X className="h-3 w-3" strokeWidth={3} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Case à cocher carrée réutilisable (checkbox visuelle, accessible). */
function CheckRow({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <label className="flex w-full cursor-pointer items-center gap-2.5 py-1 text-left">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex h-[19px] w-[19px] items-center justify-center rounded-[6px] border transition-colors',
          checked ? 'border-primary bg-primary text-white' : 'border-line bg-card',
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="text-sm text-ink">{label}</span>
    </label>
  );
}

export function FilterRail({ filters, onChange, className }: FilterRailProps) {
  const { latitude, longitude, loading: geoLoading, error: geoError, requestPosition } =
    useGeolocation();

  const toggleInArray = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  // Quand la position arrive, on l'injecte dans les filtres (sans écraser le rayon
  // déjà choisi par l'utilisateur ; rayon par défaut 30 km).
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      if (filters.lat !== latitude || filters.lng !== longitude) {
        onChange({
          ...filters,
          lat: latitude,
          lng: longitude,
          radius: filters.radius ?? 30000,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const hasGeo = filters.lat !== undefined && filters.lng !== undefined;

  const hasActive =
    !!filters.department ||
    filters.waterType.length > 0 ||
    filters.fishCategory.length > 0 ||
    filters.species.length > 0 ||
    filters.fishingMode.length > 0 ||
    filters.fishingTechnique.length > 0 ||
    !!filters.accessType ||
    hasGeo ||
    filters.parking === true ||
    filters.boatLaunch === true ||
    filters.pmr === true ||
    filters.nightFishing === true ||
    filters.minFishabilityScore !== undefined;

  const minScore = filters.minFishabilityScore ?? 0;

  const setRadius = (value: number) => {
    const next = filters.radius === value ? undefined : value;
    onChange({ ...filters, radius: next });
  };

  const clearGeo = () =>
    onChange({ ...filters, lat: undefined, lng: undefined, radius: undefined });

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
        {/* Espèce — intention « sortie » prioritaire */}
        <div>
          <SectionLabel>Espèce</SectionLabel>
          <SpeciesPicker
            selected={filters.species}
            onChange={(species) => onChange({ ...filters, species })}
          />
        </div>

        {/* Distance — autour de moi */}
        <fieldset className="border-0 p-0">
          <legend className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.04em] text-fs-faint">
            Distance
          </legend>
          <button
            type="button"
            onClick={requestPosition}
            disabled={geoLoading}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-fs-md border border-line bg-card text-sm font-semibold text-ink hover:bg-muted disabled:opacity-60"
          >
            {geoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4 text-teal-deep" />
            )}
            {hasGeo ? 'Position prise en compte' : 'Autour de moi'}
          </button>
          {geoError && (
            <p className="mt-1.5 text-xs text-fs-muted" role="alert">
              {geoError}
            </p>
          )}
          {hasGeo && (
            <>
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Rayon de recherche">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    aria-pressed={filters.radius === r.value}
                    className={cn('fs-chip', filters.radius === r.value && 'on')}
                    onClick={() => setRadius(r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={clearGeo}
                className="mt-2 text-xs font-semibold text-teal-deep hover:underline"
              >
                Retirer ma position
              </button>
            </>
          )}
        </fieldset>

        {/* Mode — position du pêcheur (FishingType : SHORE/BOAT/FLOAT_TUBE) */}
        <fieldset className="border-0 p-0">
          <legend className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.04em] text-fs-faint">
            Mode
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {FISHING_MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={filters.fishingMode.includes(opt.value)}
                className={cn('fs-chip', filters.fishingMode.includes(opt.value) && 'on')}
                onClick={() =>
                  onChange({ ...filters, fishingMode: toggleInArray(filters.fishingMode, opt.value) })
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Technique — manière de pêcher (sous-ensemble FishingType) */}
        <fieldset className="border-0 p-0">
          <legend className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.04em] text-fs-faint">
            Technique
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {FISHING_TECHNIQUE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={filters.fishingTechnique.includes(opt.value)}
                className={cn('fs-chip', filters.fishingTechnique.includes(opt.value) && 'on')}
                onClick={() =>
                  onChange({
                    ...filters,
                    fishingTechnique: toggleInArray(filters.fishingTechnique, opt.value),
                  })
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Département */}
        <div>
          <SectionLabel>Département</SectionLabel>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fs-muted" />
            <select
              value={filters.department || ''}
              onChange={(e) => onChange({ ...filters, department: e.target.value || undefined })}
              className="h-10 w-full rounded-fs-md border border-line bg-card pl-9 pr-3 text-sm text-ink"
              aria-label="Département"
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
                aria-pressed={filters.waterType.includes(key)}
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
                aria-pressed={filters.fishCategory.includes(key)}
                className={cn('fs-chip', filters.fishCategory.includes(key) && 'on')}
                onClick={() => onChange({ ...filters, fishCategory: toggleInArray(filters.fishCategory, key) })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Droit de pêche — séparé de l'accès physique */}
        <fieldset className="border-0 p-0">
          <legend className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.04em] text-fs-faint">
            Droit de pêche
          </legend>
          <div className="space-y-1">
            {Object.entries(ACCESS_TYPE_LABELS).map(([key, label]) => {
              const checked = filters.accessType === key;
              return (
                <label key={key} className="flex w-full cursor-pointer items-center gap-2.5 py-1 text-left">
                  <input
                    type="radio"
                    name="access-type"
                    checked={checked}
                    onChange={() => onChange({ ...filters, accessType: checked ? undefined : key })}
                    onClick={() => {
                      // permet de décocher la radio déjà active
                      if (checked) onChange({ ...filters, accessType: undefined });
                    }}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-[19px] w-[19px] items-center justify-center rounded-full border transition-colors',
                      checked ? 'border-primary bg-primary text-white' : 'border-line bg-card',
                    )}
                  >
                    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="text-sm text-ink">{label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Accès physique — booléens accessibility, distincts du droit de pêche */}
        <fieldset className="border-0 p-0">
          <legend className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.04em] text-fs-faint">
            Accès physique
          </legend>
          <div className="space-y-1">
            {PHYSICAL_ACCESS_OPTIONS.map(({ key, label }) => (
              <CheckRow
                key={key}
                label={label}
                checked={filters[key] === true}
                onToggle={() => onChange({ ...filters, [key]: filters[key] === true ? undefined : true })}
              />
            ))}
          </div>
        </fieldset>

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
            aria-label="Score de pêchabilité minimum"
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
