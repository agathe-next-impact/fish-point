'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createCatchSchema, type CreateCatchFormInput } from '@/validators/catch.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotificationStore } from '@/store/notification.store';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useState, useEffect, useCallback } from 'react';
import type { WeatherData } from '@/types/weather';

const LURE_TYPES = [
  'Crankbait',
  'Spinnerbait',
  'Soft plastic',
  'Cuiller',
  'Popper',
  'Jerkbait',
  'Swimbait',
  'Jig',
  'Mouche',
  'Naturel',
] as const;

const RIG_TYPES = [
  'Drop shot',
  'Carolina',
  'Texas',
  'Neko',
  'Weightless',
  'Plomb palette',
  'Montage au posé',
  'Montage feeder',
] as const;

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-md">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left hover:bg-accent/50 transition-colors"
      >
        <span>{title}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

export function CatchForm() {
  const router = useRouter();
  const addToast = useNotificationStore((s) => s.addToast);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const geo = useGeolocation({ enableHighAccuracy: true });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateCatchFormInput>({
    resolver: zodResolver(createCatchSchema),
    defaultValues: {
      isReleased: true,
      isPublic: true,
    },
  });

  const spotId = watch('spotId');

  // Fetch weather when geolocation is captured or spotId is set
  const fetchWeather = useCallback(async (spotIdValue?: string) => {
    if (spotIdValue) {
      try {
        setWeatherLoading(true);
        const res = await fetch(`/api/weather/${spotIdValue}`);
        if (res.ok) {
          const json = await res.json();
          const data = json.data as WeatherData;
          setWeather(data);
          setValue('windSpeed', data.windSpeed);
          setValue('windDirection', data.windDirection);
          setValue('cloudCover', data.cloudCover);
          setValue('humidity', data.humidity);
        }
      } catch {
        // Weather fetch is non-critical
      } finally {
        setWeatherLoading(false);
      }
    }
  }, [setValue]);

  // Auto-fetch weather when spotId changes
  useEffect(() => {
    if (spotId) {
      fetchWeather(spotId);
    }
  }, [spotId, fetchWeather]);

  // Update form when geolocation is toggled/updated
  useEffect(() => {
    if (geoEnabled && geo.latitude !== null && geo.longitude !== null) {
      setValue('catchLatitude', geo.latitude);
      setValue('catchLongitude', geo.longitude);
    } else if (!geoEnabled) {
      setValue('catchLatitude', undefined);
      setValue('catchLongitude', undefined);
    }
  }, [geoEnabled, geo.latitude, geo.longitude, setValue]);

  const handleGeoToggle = () => {
    if (!geoEnabled) {
      geo.requestPosition();
      setGeoEnabled(true);
    } else {
      setGeoEnabled(false);
    }
  };

  const onSubmit = async (data: CreateCatchFormInput) => {
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/catches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');

      addToast({ type: 'success', title: 'Prise enregistree !' });
      router.push('/catches');
    } catch {
      addToast({ type: 'error', title: "Erreur lors de l'enregistrement" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold">Enregistrer une prise</h2>

      {/* Core fields */}
      <Input placeholder="ID du spot" {...register('spotId')} error={errors.spotId?.message} />
      <Input placeholder="ID de l'espece" {...register('speciesId')} error={errors.speciesId?.message} />

      <div className="grid grid-cols-2 gap-4">
        <Input type="number" step="any" placeholder="Poids (g)" {...register('weight', { valueAsNumber: true })} error={errors.weight?.message} />
        <Input type="number" step="any" placeholder="Taille (cm)" {...register('length', { valueAsNumber: true })} error={errors.length?.message} />
      </div>

      <Input placeholder="Technique" {...register('technique')} />
      <Input placeholder="Appat" {...register('bait')} />

      <textarea
        placeholder="Notes (optionnel)"
        {...register('notes')}
        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <label className="flex items-center gap-2">
        <input type="checkbox" {...register('isReleased')} className="rounded" />
        <span className="text-sm">Poisson relache (no-kill)</span>
      </label>

      {/* Lure section */}
      <CollapsibleSection title="Leurre / Appat artificiel">
        <div>
          <label className="block text-sm font-medium mb-1">Type de leurre</label>
          <select
            {...register('lureType')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">-- Selectionner --</option>
            {LURE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="Couleur du leurre" {...register('lureColor')} error={errors.lureColor?.message} />
          <Input placeholder="Taille du leurre" {...register('lureSize')} error={errors.lureSize?.message} />
        </div>
      </CollapsibleSection>

      {/* Rig section */}
      <CollapsibleSection title="Montage">
        <div>
          <label className="block text-sm font-medium mb-1">Type de montage</label>
          <select
            {...register('rigType')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">-- Selectionner --</option>
            {RIG_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="Taille hamecon" {...register('hookSize')} error={errors.hookSize?.message} />
          <Input placeholder="Poids du fil" {...register('lineWeight')} error={errors.lineWeight?.message} />
        </div>
      </CollapsibleSection>

      {/* Geolocation section */}
      <CollapsibleSection title="Geolocalisation">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Enregistrer ma position exacte</span>
            <button
              type="button"
              onClick={handleGeoToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                geoEnabled ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  geoEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {geo.loading && (
            <p className="text-xs text-muted-foreground">Acquisition de la position...</p>
          )}
          {geo.error && (
            <p className="text-xs text-destructive">{geo.error}</p>
          )}
          {geoEnabled && geo.latitude !== null && geo.longitude !== null && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <p>Latitude: {geo.latitude.toFixed(6)}</p>
              <p>Longitude: {geo.longitude.toFixed(6)}</p>
              {geo.accuracy && <p>Precision: {Math.round(geo.accuracy)}m</p>}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            La position exacte est privee et visible uniquement par vous.
          </p>
        </div>
      </CollapsibleSection>

      {/* Weather section (read-only, auto-captured) */}
      <CollapsibleSection title="Meteo (auto)">
        {weatherLoading && (
          <p className="text-xs text-muted-foreground">Chargement de la meteo...</p>
        )}
        {weather ? (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded p-2">
                <p className="text-xs text-muted-foreground">Temperature</p>
                <p className="font-medium">{weather.temperature}°C</p>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <p className="text-xs text-muted-foreground">Humidite</p>
                <p className="font-medium">{weather.humidity}%</p>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <p className="text-xs text-muted-foreground">Vent</p>
                <p className="font-medium">{weather.windSpeed} m/s ({weather.windDirection}°)</p>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <p className="text-xs text-muted-foreground">Couverture nuageuse</p>
                <p className="font-medium">{weather.cloudCover}%</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {weather.description} - Pression: {weather.pressure} hPa
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Selectionnez un spot pour charger la meteo automatiquement.
          </p>
        )}
        {/* Hidden registered fields for weather data */}
        <input type="hidden" {...register('windSpeed', { valueAsNumber: true })} />
        <input type="hidden" {...register('windDirection', { valueAsNumber: true })} />
        <input type="hidden" {...register('cloudCover', { valueAsNumber: true })} />
        <input type="hidden" {...register('humidity', { valueAsNumber: true })} />
      </CollapsibleSection>

      {/* Visibility toggle */}
      <label className="flex items-center gap-2">
        <input type="checkbox" {...register('isPublic')} className="rounded" defaultChecked />
        <span className="text-sm">Capture publique</span>
      </label>
      <p className="text-xs text-muted-foreground -mt-2">
        Decochez pour rendre cette capture privee (visible uniquement par vous).
      </p>

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Enregistrer la prise
      </Button>
    </form>
  );
}
