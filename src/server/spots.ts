import type { Prisma } from '@/generated/prisma/client';
import type { SpotListItem } from '@/types/spot';
import type { SpotFiltersInput } from '@/validators/spot.schema';

export const spotListSelect = {
  id: true,
  slug: true,
  name: true,
  latitude: true,
  longitude: true,
  department: true,
  commune: true,
  waterType: true,
  waterCategory: true,
  fishingTypes: true,
  averageRating: true,
  reviewCount: true,
  isPremium: true,
  isVerified: true,
  images: {
    where: { isPrimary: true },
    orderBy: { createdAt: 'asc' },
    select: { url: true },
    take: 1,
  },
} satisfies Prisma.SpotSelect;

type SpotListRecord = Prisma.SpotGetPayload<{ select: typeof spotListSelect }>;

function compactArray<T>(value: T[] | undefined): T[] | undefined {
  return value && value.length > 0 ? value : undefined;
}

export function buildApprovedSpotWhere(filters: SpotFiltersInput): Prisma.SpotWhereInput {
  const and: Prisma.SpotWhereInput[] = [];
  const waterTypes = compactArray(filters.waterType);
  const fishingTypes = compactArray(filters.fishingTypes);
  const species = compactArray(filters.species);

  const where: Prisma.SpotWhereInput = { status: 'APPROVED' };

  if (filters.department) where.department = filters.department;
  if (waterTypes) where.waterType = { in: waterTypes };
  if (fishingTypes) where.fishingTypes = { hasSome: fishingTypes };
  if (species) where.species = { some: { speciesId: { in: species } } };
  if (filters.isPremium !== undefined) where.isPremium = filters.isPremium;

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { commune: { contains: filters.search, mode: 'insensitive' } },
      { department: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.minRating !== undefined && filters.minRating > 0) {
    where.averageRating = { gte: filters.minRating };
  }

  if (filters.pmr !== undefined) {
    and.push({ accessibility: { path: ['pmr'], equals: filters.pmr } });
  }

  if (filters.nightFishing !== undefined) {
    and.push({ accessibility: { path: ['nightFishing'], equals: filters.nightFishing } });
  }

  if (and.length > 0) where.AND = and;

  return where;
}

export function serializeSpotListItem(spot: SpotListRecord & { distance?: number }): SpotListItem {
  return {
    id: spot.id,
    slug: spot.slug,
    name: spot.name,
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
    primaryImage: spot.images[0]?.url || null,
    distance: spot.distance,
  };
}
