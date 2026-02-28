'use client';

import { Cloud, Thermometer, Wind, Droplets, Gauge, Sun, Flower2, Bug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeather } from '@/hooks/useWeather';

interface SpotWeatherProps {
  spotId: string;
}

const POLLEN_LEVEL_LABELS: Record<string, string> = {
  none: 'Aucun',
  low: 'Faible',
  moderate: 'Modéré',
  high: 'Élevé',
};

const POLLEN_LEVEL_COLORS: Record<string, string> = {
  none: 'text-muted-foreground',
  low: 'text-green-600 dark:text-green-400',
  moderate: 'text-amber-600 dark:text-amber-400',
  high: 'text-red-600 dark:text-red-400',
};

export function SpotWeather({ spotId }: SpotWeatherProps) {
  const { data: weather, isLoading } = useWeather(spotId);

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  if (!weather) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          Météo actuelle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm">
            <Thermometer className="h-3.5 w-3.5" /> Température
          </span>
          <span className="font-semibold">{Math.round(weather.temperature)}°C</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm">
            <Wind className="h-3.5 w-3.5" /> Vent
          </span>
          <span className="font-semibold">{Math.round(weather.windSpeed)} km/h</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm">
            <Droplets className="h-3.5 w-3.5" /> Humidité
          </span>
          <span className="font-semibold">{weather.humidity}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm">
            <Gauge className="h-3.5 w-3.5" /> Pression
          </span>
          <span className="font-semibold">{weather.pressure} hPa</span>
        </div>
        <p className="text-xs text-muted-foreground capitalize mt-1">{weather.description}</p>

        {weather.pollen && (
          <div className="pt-2 mt-2 border-t space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm">
                <Sun className="h-3.5 w-3.5" /> UV (CAMS)
              </span>
              <span className="font-semibold">{weather.pollen.uvIndex}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm">
                <Flower2 className="h-3.5 w-3.5" /> Pollen
              </span>
              <span className={`font-semibold ${POLLEN_LEVEL_COLORS[weather.pollen.pollenLevel] ?? ''}`}>
                {POLLEN_LEVEL_LABELS[weather.pollen.pollenLevel] ?? weather.pollen.pollenLevel}
              </span>
            </div>
            {weather.pollen.insectHatchLikely && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded px-2 py-1">
                <Bug className="h-3 w-3" />
                <span>Éclosions d&apos;insectes probables</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
