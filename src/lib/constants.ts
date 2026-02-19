export const APP_NAME = 'FishSpot';
export const APP_DESCRIPTION = 'Trouvez les meilleurs spots de pêche autorisés en France';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const LIMITS = {
  FREE_MAX_SPOTS: 50,
  FREE_MAX_CATCHES_PER_MONTH: 10,
  MAX_IMAGES_PER_SPOT: 10,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_SEARCH_RADIUS_METERS: 100000,
  DEFAULT_SEARCH_RADIUS_METERS: 10000,
  MIN_SEARCH_RADIUS_METERS: 100,
} as const;

export const XP_REWARDS = {
  ADD_SPOT: 50,
  LOG_CATCH: 20,
  WRITE_REVIEW: 30,
  SPOT_VERIFIED: 100,
  FIRST_CATCH: 10,
  FIRST_SPOT: 25,
} as const;

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000,
] as const;

export const WATER_TYPE_LABELS: Record<string, string> = {
  RIVER: 'Rivière',
  LAKE: 'Lac',
  POND: 'Étang',
  SEA: 'Mer',
  CANAL: 'Canal',
  RESERVOIR: 'Réservoir',
  STREAM: 'Ruisseau',
};

export const FISHING_TYPE_LABELS: Record<string, string> = {
  SPINNING: 'Lancer',
  FLY: 'Mouche',
  COARSE: 'Coup',
  CARP: 'Carpe',
  SURFCASTING: 'Surfcasting',
  TROLLING: 'Traîne',
  FLOAT_TUBE: 'Float tube',
  BOAT: 'Bateau',
  SHORE: 'Du bord',
};

export const FISH_CATEGORY_LABELS: Record<string, string> = {
  CARNIVORE: 'Carnassier',
  SALMONID: 'Salmonidé',
  CYPRINID: 'Cyprinidé',
  CATFISH: 'Silure',
  MARINE: 'Marin',
  CRUSTACEAN: 'Crustacé',
  OTHER: 'Autre',
};

export const ABUNDANCE_LABELS: Record<string, string> = {
  RARE: 'Rare',
  LOW: 'Faible',
  MODERATE: 'Modéré',
  HIGH: 'Élevé',
  VERY_HIGH: 'Très élevé',
};

export const REGULATION_TYPE_LABELS: Record<string, string> = {
  NO_KILL: 'No-kill obligatoire',
  CATCH_LIMIT: 'Quota de prises',
  SIZE_LIMIT: 'Taille minimale spécifique',
  SEASONAL_BAN: 'Interdiction saisonnière',
  PERMANENT_BAN: 'Interdiction permanente',
  NIGHT_BAN: 'Pêche de nuit interdite',
  RESERVE: 'Réserve de pêche',
  POLLUTION_ALERT: 'Alerte pollution',
  DROUGHT_ALERT: 'Alerte sécheresse',
  FLOOD_ALERT: 'Alerte crue',
  SPECIFIC_GEAR: "Restriction d'engins",
};
