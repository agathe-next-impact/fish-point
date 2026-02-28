import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SpotDetail } from '@/components/spots/SpotDetail';
import { generateSpotMetadata } from '@/config/seo';
import type { Metadata } from 'next';
import type { SpotDetail as SpotDetailType } from '@/types/spot';

interface SpotPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SpotPageProps): Promise<Metadata> {
  const { slug } = await params;
  const spot = await prisma.spot.findUnique({ where: { slug }, select: { name: true, slug: true, description: true, department: true, commune: true, averageRating: true, reviewCount: true } });
  if (!spot) return { title: 'Spot introuvable' };
  return generateSpotMetadata(spot);
}

export default async function SpotPage({ params }: SpotPageProps) {
  const { slug } = await params;
  const spot = await prisma.spot.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
      images: { orderBy: { isPrimary: 'desc' } },
      species: { include: { species: true } },
      regulations: { where: { isActive: true } },
    },
  });

  if (!spot) notFound();

  await prisma.spot.update({ where: { id: spot.id }, data: { viewCount: { increment: 1 } } });

  const spotData: SpotDetailType = {
    id: spot.id,
    slug: spot.slug,
    name: spot.name,
    description: spot.description,
    latitude: spot.latitude,
    longitude: spot.longitude,
    department: spot.department,
    commune: spot.commune,
    waterType: spot.waterType,
    waterCategory: spot.waterCategory,
    fishingTypes: spot.fishingTypes,
    averageRating: spot.averageRating,
    reviewCount: spot.reviewCount,
    isPremium: spot.isPremium,
    isVerified: spot.isVerified,
    primaryImage: spot.images.find((i) => i.isPrimary)?.url || spot.images[0]?.url || null,
    fishabilityScore: spot.fishabilityScore ?? null,
    dataOrigin: spot.dataOrigin,
    accessibility: spot.accessibility as SpotDetailType['accessibility'],
    status: spot.status,
    viewCount: spot.viewCount,
    createdAt: spot.createdAt.toISOString(),
    author: spot.author ?? null,
    images: spot.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, width: i.width, height: i.height, isPrimary: i.isPrimary })),
    species: spot.species.map((s) => ({
      id: s.id,
      speciesId: s.speciesId,
      name: s.species.name,
      scientificName: s.species.scientificName,
      category: s.species.category,
      abundance: s.abundance,
      minLegalSize: s.species.minLegalSize,
    })),
    regulations: spot.regulations.map((r) => ({
      id: r.id,
      type: r.type,
      description: r.description,
      startDate: r.startDate?.toISOString() || null,
      endDate: r.endDate?.toISOString() || null,
      isActive: r.isActive,
      source: r.source,
    })),
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <SpotDetail spot={spotData} />
    </div>
  );
}

export const dynamic = 'force-dynamic';
