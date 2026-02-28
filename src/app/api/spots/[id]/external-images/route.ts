import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/redis';
import { getOrthoPhotoUrl } from '@/services/ign-ortho.service';
import { fetchWikimediaImages } from '@/services/wikimedia-images.service';
import type { SpotImageData } from '@/types/spot';

const VALIDATE_TIMEOUT_MS = 5000;

/**
 * Validate that a URL returns a valid image via HEAD request.
 * Returns true if the server responds 200 with an image content-type.
 */
async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VALIDATE_TIMEOUT_MS);

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return false;

    const contentType = res.headers.get('content-type') || '';
    return contentType.startsWith('image/');
  } catch {
    return false;
  }
}

/**
 * GET /api/spots/:id/external-images
 * Returns validated, accessible images from IGN (aerial) and Wikimedia Commons.
 * Results are cached in Redis for 1h to avoid repeated HEAD validations.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const spot = await prisma.spot.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, latitude: true, longitude: true },
    });

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    const cacheKey = `ext_images:${spot.id}`;

    const validatedImages = await getCached(cacheKey, async () => {
      const candidates: SpotImageData[] = [];

      // IGN aerial orthophoto
      const ignUrl = getOrthoPhotoUrl(spot.latitude, spot.longitude);
      candidates.push({
        id: 'ign-ortho',
        url: ignUrl,
        alt: 'Vue aérienne',
        width: 800,
        height: 600,
        isPrimary: false,
        source: 'ign',
      });

      // Wikimedia Commons
      try {
        const wikiImages = await fetchWikimediaImages(spot.latitude, spot.longitude);
        candidates.push(...wikiImages);
      } catch {
        // Non-critical
      }

      // Validate all URLs in parallel via HEAD requests
      const results = await Promise.allSettled(
        candidates.map(async (img) => {
          const ok = await isImageAccessible(img.url);
          return ok ? img : null;
        }),
      );

      return results
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter((img): img is SpotImageData => img !== null);
    }, 3600); // 1h cache — validated images are stable

    const response = NextResponse.json({ data: validatedImages });
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return response;
  } catch (error) {
    console.error('GET /api/spots/[id]/external-images error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
