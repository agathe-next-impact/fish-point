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
  // Modèle 3 niveaux (lecture passive, slice 1) : exposés sans filtre par défaut.
  kind: true,
  parentId: true,
  images: {
    where: { isPrimary: true },
    select: { url: true },
    take: 1,
  },
  // Jointure légère (table `spot_species`, 2 colonnes scalaires — pas de join vers
  // FishSpecies) : porte l'ABONDANCE de chaque espèce par spot. C'est le seul
  // différenciateur honnête du verdict « Adapté à votre sortie » en liste quand une
  // espèce est filtrée (tous les résultats contiennent déjà l'espèce via le WHERE,
  // c'est l'abondance qui les départage). Aucune migration : relation existante.
  species: {
    select: { speciesId: true, abundance: true },
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
