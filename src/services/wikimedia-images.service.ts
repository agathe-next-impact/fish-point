import { getCached } from '@/lib/redis';
import type { SpotImageData } from '@/types/spot';

const API_BASE = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'FishPoint/1.0 (https://fishpoint.app)';

interface GeosearchResult {
  pageid: number;
  title: string;
  lat: number;
  lon: number;
  dist: number;
}

interface ImageInfoResult {
  url: string;
  thumburl?: string;
  width: number;
  height: number;
  mime: string;
}

/**
 * Fetch geo-tagged photos from Wikimedia Commons near given coordinates.
 * Returns up to 10 images within 5km radius.
 * Cache: 24h (community photos change slowly).
 */
export async function fetchWikimediaImages(
  lat: number,
  lon: number,
): Promise<SpotImageData[]> {
  const cacheKey = `wikimedia:${lat.toFixed(3)}:${lon.toFixed(3)}`;

  return getCached(cacheKey, async () => {
    // Step 1: Geosearch for nearby media files
    const searchParams = new URLSearchParams({
      action: 'query',
      list: 'geosearch',
      gscoord: `${lat}|${lon}`,
      gsradius: '5000',
      gsnamespace: '6',
      gslimit: '10',
      format: 'json',
      origin: '*',
    });

    const searchRes = await fetch(`${API_BASE}?${searchParams}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const results: GeosearchResult[] = searchData?.query?.geosearch || [];

    if (results.length === 0) return [];

    // Step 2: Get image URLs for found pages
    const pageIds = results.map((r) => r.pageid).join('|');
    const infoParams = new URLSearchParams({
      action: 'query',
      pageids: pageIds,
      prop: 'imageinfo',
      iiprop: 'url|size|mime',
      iiurlwidth: '800',
      format: 'json',
      origin: '*',
    });

    const infoRes = await fetch(`${API_BASE}?${infoParams}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!infoRes.ok) return [];

    const infoData = await infoRes.json();
    const pages = infoData?.query?.pages || {};

    const images: SpotImageData[] = [];

    for (const page of Object.values(pages) as Array<{
      pageid: number;
      title: string;
      imageinfo?: ImageInfoResult[];
    }>) {
      const info = page.imageinfo?.[0];
      if (!info) continue;

      // Only include raster images (not SVG, PDF, etc.)
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(info.mime)) continue;

      images.push({
        id: `wiki-${page.pageid}`,
        url: info.thumburl || info.url,
        alt: page.title.replace(/^File:/, '').replace(/\.\w+$/, ''),
        width: info.width,
        height: info.height,
        isPrimary: false,
        source: 'wikimedia',
      });
    }

    return images;
  }, 86400); // 24h cache
}
