'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Une erreur est survenue</h2>
      <p className="text-muted-foreground mb-6 text-center">
        Désolé, quelque chose s&apos;est mal passé. Veuillez réessayer.
      </p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
