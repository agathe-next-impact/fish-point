'use client';

import { Fish } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFishabilityScore } from '@/hooks/useFishabilityScore';

interface SpotFishIndexProps {
  spotId: string;
}

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
          <div
            className="w-14 h-14 rounded-full border-4 flex items-center justify-center"
            style={{ borderColor: data.color }}
          >
            <span className="text-lg font-bold">{data.combined}</span>
          </div>
          <div>
            <p className="font-semibold" style={{ color: data.color }}>
              {data.label}
            </p>
            <p className="text-xs text-muted-foreground">
              Statique {data.static} · Dynamique {data.dynamic}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
