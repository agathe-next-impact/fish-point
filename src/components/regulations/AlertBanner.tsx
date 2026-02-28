'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { RegulationAlert } from '@/types/regulation';

interface AlertBannerProps {
  alerts: RegulationAlert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const activeAlerts = alerts.filter((a) => !dismissed.includes(a.id));
  if (activeAlerts.length === 0) return null;

  const alert = activeAlerts[0];

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2 text-sm',
      alert.severity === 'danger' && 'bg-red-500 text-white',
      alert.severity === 'warning' && 'bg-yellow-500 text-black',
      alert.severity === 'info' && 'bg-blue-500 text-white',
    )}>
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p className="flex-1 truncate">
        <strong>{alert.title}</strong> — {alert.description}
      </p>
      <button onClick={() => setDismissed([...dismissed, alert.id])} aria-label="Fermer l'alerte">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
