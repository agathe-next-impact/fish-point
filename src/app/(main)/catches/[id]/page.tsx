import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CatchCard } from '@/components/catches/CatchCard';

export default async function CatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catchRecord = await prisma.catch.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
      spot: { select: { id: true, slug: true, name: true } },
      species: { select: { id: true, name: true, scientificName: true } },
    },
  });

  if (!catchRecord) notFound();

  const catchData = {
    ...catchRecord,
    caughtAt: catchRecord.caughtAt.toISOString(),
    createdAt: undefined as never,
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Détail de la prise</h1>
      <CatchCard catchData={catchData} />
    </div>
  );
}
