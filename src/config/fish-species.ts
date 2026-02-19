import type { FishCategory } from '@prisma/client';

export interface FishSpeciesConfig {
  name: string;
  scientificName: string;
  category: FishCategory;
  minLegalSize: number | null;
}

export const FISH_SPECIES: FishSpeciesConfig[] = [
  // Carnassiers
  { name: 'Brochet', scientificName: 'Esox lucius', category: 'CARNIVORE', minLegalSize: 60 },
  { name: 'Sandre', scientificName: 'Sander lucioperca', category: 'CARNIVORE', minLegalSize: 50 },
  { name: 'Perche', scientificName: 'Perca fluviatilis', category: 'CARNIVORE', minLegalSize: null },
  { name: 'Black bass', scientificName: 'Micropterus salmoides', category: 'CARNIVORE', minLegalSize: 30 },
  { name: 'Silure', scientificName: 'Silurus glanis', category: 'CATFISH', minLegalSize: null },

  // Salmonidés
  { name: 'Truite fario', scientificName: 'Salmo trutta fario', category: 'SALMONID', minLegalSize: 25 },
  { name: 'Truite arc-en-ciel', scientificName: 'Oncorhynchus mykiss', category: 'SALMONID', minLegalSize: 23 },
  { name: 'Saumon atlantique', scientificName: 'Salmo salar', category: 'SALMONID', minLegalSize: 50 },
  { name: 'Ombre commun', scientificName: 'Thymallus thymallus', category: 'SALMONID', minLegalSize: 30 },
  { name: 'Omble chevalier', scientificName: 'Salvelinus alpinus', category: 'SALMONID', minLegalSize: 23 },

  // Cyprinidés
  { name: 'Carpe commune', scientificName: 'Cyprinus carpio', category: 'CYPRINID', minLegalSize: null },
  { name: 'Carpe miroir', scientificName: 'Cyprinus carpio carpio', category: 'CYPRINID', minLegalSize: null },
  { name: 'Tanche', scientificName: 'Tinca tinca', category: 'CYPRINID', minLegalSize: null },
  { name: 'Gardon', scientificName: 'Rutilus rutilus', category: 'CYPRINID', minLegalSize: null },
  { name: 'Brème', scientificName: 'Abramis brama', category: 'CYPRINID', minLegalSize: null },
  { name: 'Chevesne', scientificName: 'Squalius cephalus', category: 'CYPRINID', minLegalSize: null },
  { name: 'Barbeau', scientificName: 'Barbus barbus', category: 'CYPRINID', minLegalSize: null },
  { name: 'Goujon', scientificName: 'Gobio gobio', category: 'CYPRINID', minLegalSize: null },
  { name: 'Ablette', scientificName: 'Alburnus alburnus', category: 'CYPRINID', minLegalSize: null },
  { name: 'Rotengle', scientificName: 'Scardinius erythrophthalmus', category: 'CYPRINID', minLegalSize: null },

  // Marins
  { name: 'Bar (Loup)', scientificName: 'Dicentrarchus labrax', category: 'MARINE', minLegalSize: 42 },
  { name: 'Dorade royale', scientificName: 'Sparus aurata', category: 'MARINE', minLegalSize: 23 },
  { name: 'Maquereau', scientificName: 'Scomber scombrus', category: 'MARINE', minLegalSize: 20 },
  { name: 'Lieu jaune', scientificName: 'Pollachius pollachius', category: 'MARINE', minLegalSize: 30 },
  { name: 'Sole', scientificName: 'Solea solea', category: 'MARINE', minLegalSize: 24 },
];
