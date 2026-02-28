'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Droplets, CloudRain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpotAlertsProps {
  spotId: string;
}

interface Alert {
  type: string;
  level: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
  date?: string;
}

async function fetchAlerts(spotId: string): Promise<Alert[]> {
  const res = await fetch(`/api/spots/${spotId}/alerts`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

const levelStyles = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
};

const levelIcons = {
  flow: Droplets,
  flood: CloudRain,
  default: AlertTriangle,
};

export function SpotAlerts({ spotId }: SpotAlertsProps) {
  const { data: alerts } = useQuery({
    queryKey: ['spotAlerts', spotId],
    queryFn: () => fetchAlerts(spotId),
    staleTime: 600_000,
    refetchInterval: 600_000,
  });

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        const Icon = levelIcons[alert.type as keyof typeof levelIcons] || levelIcons.default;
        return (
          <div
            key={i}
            className={cn(
              'flex items-start gap-2 p-3 rounded-lg border text-sm',
              levelStyles[alert.level],
            )}
          >
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{alert.title}</p>
              <p className="text-xs opacity-80">{alert.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
