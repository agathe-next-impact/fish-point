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
  accessibility: true,
  fishabilityScore: true,
  dataOrigin: true,
  accessType: true,
  images: {
    where: { isPrimary: true },
    select: { url: true },
    take: 1,
  },
} as const;

export function toSpotListItem<T extends {
  images: Array<{ url: string }>;
}>(spot: T) {
  const { images, ...rest } = spot;
  return {
    ...rest,
    primaryImage: images[0]?.url || null,
  };
}
