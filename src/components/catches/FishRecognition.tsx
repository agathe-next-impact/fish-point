'use client';

import { useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function FishRecognition() {
  const [result, setResult] = useState<{ name: string; confidence: number } | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Reconnaissance d&apos;espèce
          <Badge variant="warning" className="text-[10px]">Premium</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Prenez une photo de votre poisson pour identifier l&apos;espèce
          </p>
          <Button variant="outline" size="sm">
            Prendre une photo
          </Button>
        </div>
        {result && (
          <div className="mt-4 p-3 rounded-lg bg-muted">
            <p className="font-semibold">{result.name}</p>
            <p className="text-sm text-muted-foreground">Confiance : {(result.confidence * 100).toFixed(0)}%</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
