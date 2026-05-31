'use client';

import { Fish } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SpotFishIndexProps {
  spotId: string;
}

export function SpotFishIndex({ spotId }: SpotFishIndexProps) {
  // This would typically fetch from an API that calculates the fish index
  // For now, show a placeholder
  return (
    <Card data-spot-id={spotId}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Fish className="h-4 w-4" />
          Activité piscicole
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full border-4 border-green-500 flex items-center justify-center">
            <span className="text-lg font-bold">72</span>
          </div>
          <div>
            <p className="font-semibold text-green-600">Bonne</p>
            <p className="text-xs text-muted-foreground">Conditions favorables</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
