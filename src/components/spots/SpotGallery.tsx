'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpotImageData } from '@/types/spot';

interface SpotGalleryProps {
  images: SpotImageData[];
  spotName: string;
}

export function SpotGallery({ images, spotName }: SpotGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full h-64 sm:h-80 bg-muted rounded-lg flex items-center justify-center">
        <MapPin className="h-16 w-16 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden group">
      <Image
        src={images[currentIndex].url}
        alt={images[currentIndex].alt || spotName}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, 800px"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Image précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Image suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  i === currentIndex ? 'bg-white' : 'bg-white/50',
                )}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
