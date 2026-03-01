import { prisma } from '@/lib/prisma';
import { SpotCard } from '@/components/spots/SpotCard';
import type { Metadata } from 'next';

interface CommunePageProps {
  params: Promise<{ department: string; commune: string }>;
}

export async function generateMetadata({ params }: CommunePageProps): Promise<Metadata> {
  const { commune, department } = await params;
  const communeName = decodeURIComponent(commune);
  return { title: `Spots de pêche à ${communeName} (${department})` };
}

export default async function CommunePage({ params }: CommunePageProps) {
  const { department, commune } = await params;
  const communeName = decodeURIComponent(commune);

  const spots = await prisma.spot.findMany({
    where: { department, commune: communeName, status: 'APPROVED' },
    include: { images: { where: { isPrimary: true }, take: 1 } },
    orderBy: { averageRating: 'desc' },
  });

  const spotCards = spots.map((s) => ({
    id: s.id, slug: s.slug, name: s.name,
    latitude: s.latitude, longitude: s.longitude,
    department: s.department, commune: s.commune,
    waterType: s.waterType, waterCategory: s.waterCategory,
    fishingTypes: s.fishingTypes, averageRating: s.averageRating,
    reviewCount: s.reviewCount, isPremium: s.isPremium,
    isVerified: s.isVerified, primaryImage: s.images[0]?.url || null,
    fishabilityScore: s.fishabilityScore, dataOrigin: s.dataOrigin, accessType: s.accessType,
  }));

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Spots à {communeName} ({department})</h1>
      {spotCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {spotCards.map((spot) => <SpotCard key={spot.id} spot={spot} />)}
        </div>
      ) : (
        <p className="text-center py-12 text-muted-foreground">Aucun spot dans cette commune.</p>
      )}
    </div>
  );
}

export const revalidate = 86400;
