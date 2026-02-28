'use client';

import { Waves, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWaterLevel } from '@/hooks/useWaterLevel';

interface SpotWaterLevelProps {
  spotId: string;
}

export function SpotWaterLevel({ spotId }: SpotWaterLevelProps) {
  const { data: waterLevel, isLoading } = useWaterLevel(spotId);

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  if (!waterLevel) return null;

  const TrendIcon = waterLevel.trend === 'rising' ? TrendingUp : waterLevel.trend === 'falling' ? TrendingDown : Minus;
  const trendColor = waterLevel.trend === 'rising' ? 'text-blue-500' : waterLevel.trend === 'falling' ? 'text-red-500' : 'text-muted-foreground';
  const trendLabel = waterLevel.trend === 'rising' ? 'En hausse' : waterLevel.trend === 'falling' ? 'En baisse' : 'Stable';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Waves className="h-4 w-4" />
          Niveau d&apos;eau
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{waterLevel.currentLevel.toFixed(2)} {waterLevel.unit}</p>
            <p className={`text-sm flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="h-3.5 w-3.5" /> {trendLabel}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
