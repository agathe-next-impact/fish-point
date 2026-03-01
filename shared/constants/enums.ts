// Enums extracted from Prisma schema for use in both web and mobile

export const WaterType = {
  RIVER: 'RIVER',
  LAKE: 'LAKE',
  POND: 'POND',
  SEA: 'SEA',
  CANAL: 'CANAL',
  STREAM: 'STREAM',
} as const;
export type WaterType = (typeof WaterType)[keyof typeof WaterType];

export const WaterCategory = {
  FIRST: 'FIRST',
  SECOND: 'SECOND',
} as const;
export type WaterCategory = (typeof WaterCategory)[keyof typeof WaterCategory];

export const FishingType = {
  SPINNING: 'SPINNING',
  FLY: 'FLY',
  COARSE: 'COARSE',
  CARP: 'CARP',
  SURFCASTING: 'SURFCASTING',
  TROLLING: 'TROLLING',
  FLOAT_TUBE: 'FLOAT_TUBE',
  BOAT: 'BOAT',
  SHORE: 'SHORE',
} as const;
export type FishingType = (typeof FishingType)[keyof typeof FishingType];

export const SpotStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REPORTED: 'REPORTED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type SpotStatus = (typeof SpotStatus)[keyof typeof SpotStatus];

export const Abundance = {
  RARE: 'RARE',
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
  VERY_HIGH: 'VERY_HIGH',
} as const;
export type Abundance = (typeof Abundance)[keyof typeof Abundance];

export const FishCategory = {
  CARNIVORE: 'CARNIVORE',
  SALMONID: 'SALMONID',
  CYPRINID: 'CYPRINID',
  CATFISH: 'CATFISH',
  MARINE: 'MARINE',
  CRUSTACEAN: 'CRUSTACEAN',
  OTHER: 'OTHER',
} as const;
export type FishCategory = (typeof FishCategory)[keyof typeof FishCategory];

export const DataOrigin = {
  USER: 'USER',
  AUTO_HUBEAU: 'AUTO_HUBEAU',
  AUTO_SANDRE: 'AUTO_SANDRE',
  AUTO_OSM: 'AUTO_OSM',
} as const;
export type DataOrigin = (typeof DataOrigin)[keyof typeof DataOrigin];

export const AlertType = {
  IDEAL_CONDITIONS: 'IDEAL_CONDITIONS',
  REGULATION_REMINDER: 'REGULATION_REMINDER',
  WATER_LEVEL_ABNORMAL: 'WATER_LEVEL_ABNORMAL',
  CUSTOM_SPOT_ACTIVITY: 'CUSTOM_SPOT_ACTIVITY',
} as const;
export type AlertType = (typeof AlertType)[keyof typeof AlertType];

export const AccessType = {
  FREE: 'FREE',
  FISHING_CARD: 'FISHING_CARD',
  AAPPMA_SPECIFIC: 'AAPPMA_SPECIFIC',
  PAID: 'PAID',
  MEMBERS_ONLY: 'MEMBERS_ONLY',
  RESTRICTED: 'RESTRICTED',
  PRIVATE: 'PRIVATE',
} as const;
export type AccessType = (typeof AccessType)[keyof typeof AccessType];

// Labels francais
export const WATER_TYPE_LABELS: Record<WaterType, string> = {
  RIVER: 'Riviere',
  LAKE: 'Lac',
  POND: 'Etang',
  SEA: 'Mer',
  CANAL: 'Canal',
  STREAM: 'Ruisseau',
};

export const FISHING_TYPE_LABELS: Record<FishingType, string> = {
  SPINNING: 'Lancer',
  FLY: 'Mouche',
  COARSE: 'Coup',
  CARP: 'Carpe',
  SURFCASTING: 'Surfcasting',
  TROLLING: 'Traine',
  FLOAT_TUBE: 'Float tube',
  BOAT: 'Bateau',
  SHORE: 'Bord',
};

export const FISH_CATEGORY_LABELS: Record<FishCategory, string> = {
  CARNIVORE: 'Carnassier',
  SALMONID: 'Salmonide',
  CYPRINID: 'Cyprinide',
  CATFISH: 'Silure',
  MARINE: 'Marin',
  CRUSTACEAN: 'Crustace',
  OTHER: 'Autre',
};

export const ABUNDANCE_LABELS: Record<Abundance, string> = {
  RARE: 'Rare',
  LOW: 'Faible',
  MODERATE: 'Modere',
  HIGH: 'Eleve',
  VERY_HIGH: 'Tres eleve',
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  IDEAL_CONDITIONS: 'Conditions ideales',
  REGULATION_REMINDER: 'Rappel reglementaire',
  WATER_LEVEL_ABNORMAL: "Niveau d'eau anormal",
  CUSTOM_SPOT_ACTIVITY: 'Activite sur un spot',
};

export const ACCESS_TYPE_LABELS: Record<AccessType, string> = {
  FREE: 'Libre',
  FISHING_CARD: 'Carte de peche',
  AAPPMA_SPECIFIC: 'AAPPMA specifique',
  PAID: 'Payant',
  MEMBERS_ONLY: 'Membres uniquement',
  RESTRICTED: 'Restreint',
  PRIVATE: 'Prive',
};
