'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExternalImages } from '@/hooks/useExternalImages';
import type { SpotImageData } from '@/types/spot';

const SOURCE_LABELS: Record<string, string> = {
  ign: 'Vue aérienne · IGN',
  wikimedia: 'Wikimedia Commons',
};

// Tiny transparent blurred placeholder (10x10 gray)
const BLUR_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+';

interface SpotGalleryProps {
  images: SpotImageData[];
  spotName: string;
  spotId?: string;
}

export function SpotGallery({ images, spotName, spotId }: SpotGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const { data: externalImages, isLoading } = useExternalImages(spotId ?? null);

  const allImages = useMemo(() => {
    const dbImages = images.map((img) => ({ ...img, source: img.source ?? ('user' as const) }));
    const external = externalImages ?? [];
    const combined = [...dbImages, ...external];
    // Filter out images that failed to load client-side
    return combined.filter((img) => !failedIds.has(img.id));
  }, [images, externalImages, failedIds]);

  const handleImageError = useCallback((id: string) => {
    setFailedIds((prev) => new Set(prev).add(id));
    // Reset index if the current image failed
    setCurrentIndex(0);
  }, []);

  // No images and nothing loading — render nothing
  if (allImages.length === 0 && !isLoading) {
    return null;
  }

  // Still loading external images, no DB images yet — render nothing (avoid empty placeholder flash)
  if (allImages.length === 0 && isLoading) {
    return null;
  }

  const safeIndex = currentIndex >= allImages.length ? 0 : currentIndex;
  const current = allImages[safeIndex];
  const sourceLabel = current.source ? SOURCE_LABELS[current.source] : null;

  return (
    <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden group">
      <Image
        key={current.id}
        src={current.url}
        alt={current.alt || spotName}
        fill
        className="object-cover"
        priority={safeIndex === 0}
        loading={safeIndex === 0 ? 'eager' : 'lazy'}
        sizes="(max-width: 768px) 100vw, 800px"
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        onError={() => handleImageError(current.id)}
      />

      {sourceLabel && (
        <span className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm z-10">
          {sourceLabel}
        </span>
      )}

      {allImages.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((i) => (i > 0 ? i - 1 : allImages.length - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="Image précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentIndex((i) => (i < allImages.length - 1 ? i + 1 : 0))}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="Image suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {allImages.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  i === safeIndex ? 'bg-white' : 'bg-white/50',
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
