'use client';

import { Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { APP_URL } from '@/lib/constants';

interface SpotShareButtonProps {
  spotName: string;
  spotSlug: string;
}

export function SpotShareButton({ spotName, spotSlug }: SpotShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const url = `${APP_URL}/spots/${spotSlug}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: spotName, text: `Découvrez ${spotName} sur FishSpot`, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {copied ? <Check className="h-4 w-4 mr-1" /> : <Share2 className="h-4 w-4 mr-1" />}
      {copied ? 'Copié' : 'Partager'}
    </Button>
  );
}
