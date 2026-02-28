'use client';

import { Moon, Sun, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFishabilityScore } from '@/hooks/useFishabilityScore';

interface SpotSolunarProps {
  spotId: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function isCurrentPeriod(start: string, end: string): boolean {
  const now = Date.now();
  return now >= new Date(start).getTime() && now <= new Date(end).getTime();
}

export function SpotSolunar({ spotId }: SpotSolunarProps) {
  const { data } = useFishabilityScore(spotId);
  const solunar = data?.solunar;

  if (!solunar || !solunar.periods?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Moon className="h-4 w-4" />
          Tables solunaires
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">{solunar.moonPhaseName}</p>
        <div className="space-y-1">
          {solunar.periods.map((period: { type: string; label: string; start: string; end: string }, i: number) => {
            const isCurrent = isCurrentPeriod(period.start, period.end);
            const isMajor = period.type === 'major';

            return (
              <div
                key={i}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs ${
                  isCurrent
                    ? isMajor
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    : 'bg-muted/50'
                }`}
              >
                {isMajor ? (
                  <Sun className="h-3 w-3 shrink-0" />
                ) : period.label.includes('Lever') ? (
                  <ArrowUp className="h-3 w-3 shrink-0" />
                ) : (
                  <ArrowDown className="h-3 w-3 shrink-0" />
                )}
                <span className="font-medium flex-1">{period.label}</span>
                <span className={`text-[10px] ${isMajor ? 'font-semibold' : ''}`}>
                  {formatTime(period.start)} — {formatTime(period.end)}
                </span>
                {isCurrent && <Clock className="h-3 w-3 shrink-0 animate-pulse" />}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Périodes majeures = transit lunaire ±1h · Mineures = lever/coucher ±30min
        </p>
      </CardContent>
    </Card>
  );
}
