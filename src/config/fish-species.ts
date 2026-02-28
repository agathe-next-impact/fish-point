import type { FishCategory } from '@prisma/client';
import { FISHBASE_DATA } from './fishbase-data';

export interface FishSpeciesConfig {
  name: string;
  scientificName: string;
  category: FishCategory;
  minLegalSize: number | null;
  maxLengthCm?: number | null;
  maxWeightKg?: number | null;
  optimalTempMin?: number | null;
  optimalTempMax?: number | null;
  feedingType?: string | null;
  habitat?: string | null;
  spawnMonthStart?: number | null;
  spawnMonthEnd?: number | null;
}

export const FISH_SPECIES: FishSpeciesConfig[] = [
  // Carnassiers
  { name: 'Brochet', scientificName: 'Esox lucius', category: 'CARNIVORE', minLegalSize: 60, ...FISHBASE_DATA['Esox lucius'] },
  { name: 'Sandre', scientificName: 'Sander lucioperca', category: 'CARNIVORE', minLegalSize: 50, ...FISHBASE_DATA['Sander lucioperca'] },
  { name: 'Perche', scientificName: 'Perca fluviatilis', category: 'CARNIVORE', minLegalSize: null, ...FISHBASE_DATA['Perca fluviatilis'] },
  { name: 'Black bass', scientificName: 'Micropterus salmoides', category: 'CARNIVORE', minLegalSize: 30, ...FISHBASE_DATA['Micropterus salmoides'] },
  { name: 'Silure', scientificName: 'Silurus glanis', category: 'CATFISH', minLegalSize: null, ...FISHBASE_DATA['Silurus glanis'] },

  // Salmonidés
  { name: 'Truite fario', scientificName: 'Salmo trutta fario', category: 'SALMONID', minLegalSize: 25, ...FISHBASE_DATA['Salmo trutta fario'] },
  { name: 'Truite arc-en-ciel', scientificName: 'Oncorhynchus mykiss', category: 'SALMONID', minLegalSize: 23, ...FISHBASE_DATA['Oncorhynchus mykiss'] },
  { name: 'Saumon atlantique', scientificName: 'Salmo salar', category: 'SALMONID', minLegalSize: 50, ...FISHBASE_DATA['Salmo salar'] },
  { name: 'Ombre commun', scientificName: 'Thymallus thymallus', category: 'SALMONID', minLegalSize: 30, ...FISHBASE_DATA['Thymallus thymallus'] },
  { name: 'Omble chevalier', scientificName: 'Salvelinus alpinus', category: 'SALMONID', minLegalSize: 23, ...FISHBASE_DATA['Salvelinus alpinus'] },

  // Cyprinidés
  { name: 'Carpe commune', scientificName: 'Cyprinus carpio', category: 'CYPRINID', minLegalSize: null, ...FISHBASE_DATA['Cyprinus carpio'] },
  { name: 'Carpe miroir', scientificName: 'Cyprinus carpio carpio', category: 'CYPRINID', minLegalSize: null, ...FISHBASE_DATA['Cyprinus carpio carpio'] },
  { name: 'Tanche', scientificName: 'Tinca tinca', category: 'CYPRINID', minLegalSize: null, ...FISHBASE_DATA['Tinca tinca'] },
  { name: 'Gardon', scientificName: 'Rutilus rutilus', category: 'CYPRINID', minLegalSize: null, ...FISHBASE_DATA['Rutilus rutilus'] },
  { name: 'Brème', scientificName: 'Abramis brama', category: 'CYPRINID', minLegalSize: null, ...FISHBASE_DATA['Abramis brama'] },
  { name: 'Chevesne', scientificName: 'Squalius cephalus', category: 'CYPRINID', minLegalSize: null, ...FISHBASE_DATA['Squalius cephalus'] },
  { name: 'Barbeau', scientificName: 'Barbus barbus', category: 'CYPRINID', minLegalSize: null, ...FISHBASE_DATA['Barbus barbus'] },
  { name: 'Goujon', scientificName: 'Gobio gobio', category: 'CYPRINID', minLegalSize: null, ...FISHBASE_DATA['Gobio gobio'] },
  { name: 'Ablette', scientificName: 'Alburnus alburnus', category: 'CYPRINID', minLegalSize: null, ...FISHBASE_DATA['Alburnus alburnus'] },
  { name: 'Rotengle', scientificName: 'Scardinius erythrophthalmus', category: 'CYPRINID', minLegalSize: null, ...FISHBASE_DATA['Scardinius erythrophthalmus'] },

  // Marins
  { name: 'Bar (Loup)', scientificName: 'Dicentrarchus labrax', category: 'MARINE', minLegalSize: 42, ...FISHBASE_DATA['Dicentrarchus labrax'] },
  { name: 'Dorade royale', scientificName: 'Sparus aurata', category: 'MARINE', minLegalSize: 23, ...FISHBASE_DATA['Sparus aurata'] },
  { name: 'Maquereau', scientificName: 'Scomber scombrus', category: 'MARINE', minLegalSize: 20, ...FISHBASE_DATA['Scomber scombrus'] },
  { name: 'Lieu jaune', scientificName: 'Pollachius pollachius', category: 'MARINE', minLegalSize: 30, ...FISHBASE_DATA['Pollachius pollachius'] },
  { name: 'Sole', scientificName: 'Solea solea', category: 'MARINE', minLegalSize: 24, ...FISHBASE_DATA['Solea solea'] },
];
