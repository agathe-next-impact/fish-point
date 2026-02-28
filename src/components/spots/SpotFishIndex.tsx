'use client';

import { Fish, Wind, Droplets, Moon, Thermometer, Gauge, CloudRain, ArrowUp, ArrowDown, Minus, Sun, Layers, AlertTriangle, TrendingDown, CloudDrizzle, Waves, Flower2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFishabilityScore } from '@/hooks/useFishabilityScore';

interface SpotFishIndexProps {
  spotId: string;
}

const FACTOR_ICONS: Record<string, typeof Fish> = {
  'Écoulement': Droplets,
  'Vigilance crues': CloudRain,
  'Sécheresse': AlertTriangle,
  'Pression': Gauge,
  'Tendance baro': TrendingDown,
  'Vent': Wind,
  'UV': Sun,
  'Précipitations': CloudDrizzle,
  'Solunaire': Moon,
  'Lune': Moon,
  'Nappe': Layers,
  'Temp. eau': Thermometer,
  'Prévision crues': Waves,
  'Pollen': Flower2,
};

const IMPACT_STYLES = {
  positive: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', Icon: ArrowUp },
  neutral: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-muted-foreground', Icon: Minus },
  negative: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', Icon: ArrowDown },
};

export function SpotFishIndex({ spotId }: SpotFishIndexProps) {
  const { data, isLoading, isError } = useFishabilityScore(spotId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Fish className="h-4 w-4" />
            Activité piscicole
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Fish className="h-4 w-4" />
            Activité piscicole
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Score indisponible</p>
        </CardContent>
      </Card>
    );
  }

  const staticScore = data.staticScore ?? 0;
  const dynamicScore = data.dynamicScore ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Fish className="h-4 w-4" />
          Activité piscicole
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Main score circle */}
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full border-4 flex items-center justify-center"
            style={{ borderColor: data.color }}
          >
            <span className="text-lg font-bold">{data.fishabilityScore}</span>
          </div>
          <div>
            <p className="font-semibold" style={{ color: data.color }}>
              {data.label}
            </p>
            <p className="text-xs text-muted-foreground">
              Statique {staticScore} · Dynamique {dynamicScore}
            </p>
          </div>
        </div>

        {/* Score bars */}
        <div className="space-y-1.5">
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-muted-foreground">Statique (45%)</span>
              <span className="font-medium">{staticScore}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${staticScore}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-muted-foreground">Dynamique (55%)</span>
              <span className="font-medium">{dynamicScore}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${dynamicScore}%` }} />
            </div>
          </div>
        </div>

        {/* Factors */}
        {data.factors && data.factors.length > 0 && (
          <div className="space-y-1 pt-1 border-t">
            {data.factors.map((factor: { name: string; impact: 'positive' | 'neutral' | 'negative'; description: string }, i: number) => {
              const FactorIcon = FACTOR_ICONS[factor.name] || Fish;
              const style = IMPACT_STYLES[factor.impact];
              const ImpactIcon = style.Icon;
              return (
                <div key={i} className={`flex items-center gap-2 rounded px-2 py-1 ${style.bg}`}>
                  <FactorIcon className={`h-3 w-3 shrink-0 ${style.text}`} />
                  <span className={`text-xs font-medium ${style.text} flex-1 truncate`}>{factor.name}</span>
                  <span className={`text-[10px] ${style.text} truncate max-w-30`}>{factor.description}</span>
                  <ImpactIcon className={`h-3 w-3 shrink-0 ${style.text}`} />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
