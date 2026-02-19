import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SpotCard } from '@/components/spots/SpotCard';
import { getDepartmentByCode, DEPARTMENTS } from '@/config/departments';
import { generateDepartmentMetadata } from '@/config/seo';
import type { Metadata } from 'next';

interface DepartmentPageProps {
  params: Promise<{ department: string }>;
}

export async function generateStaticParams() {
  return DEPARTMENTS.map((d) => ({ department: d.code }));
}

export async function generateMetadata({ params }: DepartmentPageProps): Promise<Metadata> {
  const { department } = await params;
  const dept = getDepartmentByCode(department);
  if (!dept) return { title: 'Département introuvable' };
  return generateDepartmentMetadata({ code: dept.code, name: dept.name, spotsCount: 0 });
}

export default async function DepartmentPage({ params }: DepartmentPageProps) {
  const { department } = await params;
  const dept = getDepartmentByCode(department);
  if (!dept) notFound();

  const spots = await prisma.spot.findMany({
    where: { department, status: 'APPROVED' },
    include: { images: { where: { isPrimary: true }, take: 1 } },
    orderBy: { averageRating: 'desc' },
    take: 50,
  });

  const spotCards = spots.map((s) => ({
    id: s.id, slug: s.slug, name: s.name,
    latitude: s.latitude, longitude: s.longitude,
    department: s.department, commune: s.commune,
    waterType: s.waterType, waterCategory: s.waterCategory,
    fishingTypes: s.fishingTypes, averageRating: s.averageRating,
    reviewCount: s.reviewCount, isPremium: s.isPremium,
    isVerified: s.isVerified, primaryImage: s.images[0]?.url || null,
  }));

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">Spots de pêche - {dept.name} ({dept.code})</h1>
      <p className="text-muted-foreground mb-6">{dept.federation}</p>

      {spotCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {spotCards.map((spot) => <SpotCard key={spot.id} spot={spot} />)}
        </div>
      ) : (
        <p className="text-center py-12 text-muted-foreground">Aucun spot dans ce département pour le moment.</p>
      )}
    </div>
  );
}
