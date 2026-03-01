import { getCached } from '@/lib/redis';
import type { SpotImageData } from '@/types/spot';

const UNSPLASH_API = 'https://api.unsplash.com/search/photos';

const WATER_TYPE_QUERIES: Record<string, string> = {
  RIVER: 'fishing river france',
  LAKE: 'fishing lake',
  POND: 'fishing pond',
  SEA: 'sea fishing coast',
  CANAL: 'canal fishing',
  STREAM: 'fly fishing stream',
};

interface UnsplashPhoto {
  id: string;
  urls: { regular: string; small: string };
  width: number;
  height: number;
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    links: { html: string };
  };
  links: { html: string };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
}

/**
 * Fetch thematic fishing photos from Unsplash based on spot water type.
 * Returns up to 3 images with photographer attribution.
 * Cache: 24h.
 *
 * Requires env var: UNSPLASH_ACCESS_KEY
 */
export async function fetchUnsplashImages(
  waterType: string,
): Promise<SpotImageData[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return [];

  const query = WATER_TYPE_QUERIES[waterType] || 'fishing';
  const cacheKey = `unsplash:${query.replace(/\s/g, '_')}`;

  return getCached(
    cacheKey,
    async () => {
      try {
        const params = new URLSearchParams({
          query,
          per_page: '3',
          orientation: 'landscape',
        });

        const res = await fetch(`${UNSPLASH_API}?${params}`, {
          headers: { Authorization: `Client-ID ${accessKey}` },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) return [];

        const data: UnsplashSearchResponse = await res.json();

        return data.results.map((photo): SpotImageData => ({
          id: `unsplash-${photo.id}`,
          url: photo.urls.regular,
          alt: photo.alt_description || photo.description || 'Photo de pêche',
          width: photo.width,
          height: photo.height,
          isPrimary: false,
          source: 'unsplash',
          photographerName: photo.user.name,
          photographerUrl: photo.user.links.html,
        }));
      } catch {
        return [];
      }
    },
    86400, // 24h
  );
}
