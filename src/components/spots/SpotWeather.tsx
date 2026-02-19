'use client';

import { Cloud, Thermometer, Wind, Droplets, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeather } from '@/hooks/useWeather';

interface SpotWeatherProps {
  spotId: string;
}

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
      </CardContent>
    </Card>
  );
}
