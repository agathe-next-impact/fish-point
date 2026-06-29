import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/redis';
import { aggregateRecentCatches, type PublicCatchRow } from '@/lib/spot-catches';

/**
 * Lecture agrégée READ-ONLY des prises publiques d'un spot, groupées par espèce.
 *
 * Confidentialité (NON négociable) :
 * - Filtre `isPublic: true` → seules les prises rendues publiques par l'auteur.
 * - Le `select` n'expose AUCUN champ privé : ni `catchLatitude`/`catchLongitude`
 *   (géoloc « never exposed publicly »), ni `userId`/`user` (identité de l'auteur).
 *   Seuls transitent : espèce, date de capture, poids, longueur — tous agrégés.
 *
 * Aucune écriture : ce handler ne touche pas au schéma et n'effectue aucune mutation.
 */

/** Fenêtre de récence : on ne remonte que les prises des 12 derniers mois. */
const RECENT_WINDOW_DAYS = 365;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const spot = await prisma.spot.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    const cacheKey = `spot:${spot.id}:recent-catches`;
    const data = await getCached(cacheKey, async () => {
      const since = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

      const catches = await prisma.catch.findMany({
        where: {
          spotId: spot.id,
          isPublic: true,
          caughtAt: { gte: since },
        },
        orderBy: { caughtAt: 'desc' },
        // SELECT explicite : aucun champ privé. PAS de catchLatitude/catchLongitude,
        // PAS de userId/user, PAS de notes. Uniquement de quoi agréger par espèce.
        select: {
          caughtAt: true,
          weight: true,
          length: true,
          species: {
            select: {
              id: true,
              name: true,
              scientificName: true,
              category: true,
            },
          },
        },
      });

      const rows: PublicCatchRow[] = catches.map((c) => ({
        speciesId: c.species.id,
        speciesName: c.species.name,
        scientificName: c.species.scientificName,
        category: c.species.category,
        caughtAt: c.caughtAt.toISOString(),
        weight: c.weight,
        length: c.length,
      }));

      return aggregateRecentCatches(rows);
    }, 600);

    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' },
    });
  } catch (error) {
    console.error('Recent catches error:', error);
    return NextResponse.json({ error: 'Failed to fetch recent catches' }, { status: 500 });
  }
}
