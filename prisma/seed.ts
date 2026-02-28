import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { FISHBASE_DATA } from '../src/config/fishbase-data';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const FISH_SPECIES = [
  { name: 'Brochet', scientificName: 'Esox lucius', category: 'CARNIVORE' as const, minLegalSize: 60 },
  { name: 'Sandre', scientificName: 'Sander lucioperca', category: 'CARNIVORE' as const, minLegalSize: 50 },
  { name: 'Perche', scientificName: 'Perca fluviatilis', category: 'CARNIVORE' as const, minLegalSize: null },
  { name: 'Black bass', scientificName: 'Micropterus salmoides', category: 'CARNIVORE' as const, minLegalSize: 30 },
  { name: 'Silure', scientificName: 'Silurus glanis', category: 'CATFISH' as const, minLegalSize: null },
  { name: 'Truite fario', scientificName: 'Salmo trutta fario', category: 'SALMONID' as const, minLegalSize: 25 },
  { name: 'Truite arc-en-ciel', scientificName: 'Oncorhynchus mykiss', category: 'SALMONID' as const, minLegalSize: 23 },
  { name: 'Carpe commune', scientificName: 'Cyprinus carpio', category: 'CYPRINID' as const, minLegalSize: null },
  { name: 'Carpe miroir', scientificName: 'Cyprinus carpio carpio', category: 'CYPRINID' as const, minLegalSize: null },
  { name: 'Tanche', scientificName: 'Tinca tinca', category: 'CYPRINID' as const, minLegalSize: null },
  { name: 'Gardon', scientificName: 'Rutilus rutilus', category: 'CYPRINID' as const, minLegalSize: null },
  { name: 'Bar (Loup)', scientificName: 'Dicentrarchus labrax', category: 'MARINE' as const, minLegalSize: 42 },
  { name: 'Dorade royale', scientificName: 'Sparus aurata', category: 'MARINE' as const, minLegalSize: 23 },
];

const SPOTS = [
  // --- Lacs ---
  { name: 'Lac du Bourget', lat: 45.7295, lng: 5.8613, dept: '73', commune: 'Le Bourget-du-Lac', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'BOAT' as const, 'SHORE' as const] },
  { name: 'Lac d\'Annecy', lat: 45.8614, lng: 6.1699, dept: '74', commune: 'Annecy', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'FLY' as const, 'SHORE' as const] },
  { name: 'Lac Léman - Thonon', lat: 46.3706, lng: 6.4792, dept: '74', commune: 'Thonon-les-Bains', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'TROLLING' as const, 'BOAT' as const] },
  { name: 'Lac de Serre-Ponçon', lat: 44.4997, lng: 6.3331, dept: '05', commune: 'Savines-le-Lac', water: 'RESERVOIR' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'BOAT' as const, 'FLOAT_TUBE' as const] },
  { name: 'Lac de Vassivière', lat: 45.8039, lng: 1.8481, dept: '23', commune: 'Royère-de-Vassivière', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'CARP' as const, 'BOAT' as const] },
  { name: 'Lac de Madine', lat: 48.9167, lng: 5.7333, dept: '55', commune: 'Nonsard-Lamarche', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['CARP' as const, 'SPINNING' as const, 'SHORE' as const] },
  { name: 'Lac de Sainte-Croix', lat: 43.7697, lng: 6.1828, dept: '83', commune: 'Aiguines', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'FLOAT_TUBE' as const, 'BOAT' as const] },
  { name: 'Lac d\'Orient', lat: 48.2667, lng: 4.2500, dept: '10', commune: 'Mesnil-Saint-Père', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['CARP' as const, 'SPINNING' as const, 'BOAT' as const] },
  { name: 'Lac de Pareloup', lat: 44.2000, lng: 2.7333, dept: '12', commune: 'Salles-Curan', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'BOAT' as const, 'CARP' as const] },
  { name: 'Lac du Der-Chantecoq', lat: 48.5667, lng: 4.7500, dept: '51', commune: 'Giffaumont-Champaubert', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['CARP' as const, 'SPINNING' as const, 'BOAT' as const] },
  { name: 'Lac de Cazaux-Sanguinet', lat: 44.4833, lng: -1.1500, dept: '40', commune: 'Sanguinet', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'SHORE' as const, 'BOAT' as const] },
  { name: 'Lac d\'Aiguebelette', lat: 45.5500, lng: 5.8000, dept: '73', commune: 'Aiguebelette-le-Lac', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'SHORE' as const, 'FLOAT_TUBE' as const] },
  { name: 'Lac de Naussac', lat: 44.7333, lng: 3.8000, dept: '48', commune: 'Naussac-Fontanes', water: 'RESERVOIR' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'BOAT' as const, 'FLY' as const] },
  { name: 'Lac de Guerlédan', lat: 48.2000, lng: -3.0500, dept: '22', commune: 'Mûr-de-Bretagne', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'CARP' as const, 'BOAT' as const] },
  { name: 'Lac de Grand-Lieu', lat: 47.0833, lng: -1.6667, dept: '44', commune: 'Saint-Philbert-de-Grand-Lieu', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'SPINNING' as const, 'SHORE' as const] },
  { name: 'Lac du Salagou', lat: 43.6500, lng: 3.3667, dept: '34', commune: 'Clermont-l\'Hérault', water: 'RESERVOIR' as const, cat: 'SECOND' as const, types: ['CARP' as const, 'SPINNING' as const, 'FLOAT_TUBE' as const] },
  { name: 'Lac de Vouglans', lat: 46.5167, lng: 5.6833, dept: '39', commune: 'Orgelet', water: 'RESERVOIR' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'TROLLING' as const, 'BOAT' as const] },
  { name: 'Lac d\'Aydat', lat: 45.6600, lng: 2.9800, dept: '63', commune: 'Aydat', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'CARP' as const, 'SHORE' as const] },
  { name: 'Lac de Montbel', lat: 42.9333, lng: 1.8833, dept: '09', commune: 'Montbel', water: 'RESERVOIR' as const, cat: 'SECOND' as const, types: ['CARP' as const, 'SPINNING' as const, 'BOAT' as const] },
  { name: 'Lac de Pierre-Percée', lat: 48.4500, lng: 6.9333, dept: '54', commune: 'Pierre-Percée', water: 'RESERVOIR' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const, 'BOAT' as const] },
  { name: 'Lac de Gérardmer', lat: 48.0700, lng: 6.8600, dept: '88', commune: 'Gérardmer', water: 'LAKE' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const, 'BOAT' as const] },
  { name: 'Lac de Panthier', lat: 47.1833, lng: 4.5833, dept: '21', commune: 'Commarin', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['CARP' as const, 'COARSE' as const, 'SHORE' as const] },
  { name: 'Lac de Carcans-Hourtin', lat: 45.1167, lng: -1.1500, dept: '33', commune: 'Carcans', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'BOAT' as const, 'SHORE' as const] },

  // --- Rivières ---
  { name: 'Rhône - Lyon Confluence', lat: 45.7404, lng: 4.8187, dept: '69', commune: 'Lyon', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'COARSE' as const, 'SHORE' as const] },
  { name: 'Gave de Pau - Nay', lat: 43.1786, lng: -0.2617, dept: '64', commune: 'Nay', water: 'RIVER' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const] },
  { name: 'Loire - Orléans', lat: 47.9029, lng: 1.9039, dept: '45', commune: 'Orléans', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'COARSE' as const, 'CARP' as const] },
  { name: 'Garonne - Bordeaux', lat: 44.8378, lng: -0.5792, dept: '33', commune: 'Bordeaux', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'SURFCASTING' as const, 'SHORE' as const] },
  { name: 'Dordogne - Bergerac', lat: 44.8534, lng: 0.4832, dept: '24', commune: 'Bergerac', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'FLY' as const, 'COARSE' as const] },
  { name: 'Seine - Paris', lat: 48.8566, lng: 2.3522, dept: '75', commune: 'Paris', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'SPINNING' as const, 'SHORE' as const] },
  { name: 'Allier - Vichy', lat: 46.1245, lng: 3.4255, dept: '03', commune: 'Vichy', water: 'RIVER' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const] },
  { name: 'Doubs - Besançon', lat: 47.2378, lng: 6.0244, dept: '25', commune: 'Besançon', water: 'RIVER' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const, 'COARSE' as const] },
  { name: 'Lot - Cahors', lat: 44.4475, lng: 1.4403, dept: '46', commune: 'Cahors', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'COARSE' as const, 'SHORE' as const] },
  { name: 'Tarn - Millau', lat: 44.0986, lng: 3.0783, dept: '12', commune: 'Millau', water: 'RIVER' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const] },
  { name: 'Isère - Grenoble', lat: 45.1885, lng: 5.7245, dept: '38', commune: 'Grenoble', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'COARSE' as const, 'SHORE' as const] },
  { name: 'Adour - Dax', lat: 43.7102, lng: -1.0534, dept: '40', commune: 'Dax', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'COARSE' as const, 'SHORE' as const] },
  { name: 'Cher - Tours', lat: 47.3594, lng: 0.6906, dept: '37', commune: 'Tours', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'CARP' as const, 'SHORE' as const] },
  { name: 'Vienne - Limoges', lat: 45.8315, lng: 1.2578, dept: '87', commune: 'Limoges', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'FLY' as const, 'SHORE' as const] },
  { name: 'Saône - Mâcon', lat: 46.3069, lng: 4.8343, dept: '71', commune: 'Mâcon', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'CARP' as const, 'SPINNING' as const] },
  { name: 'Moselle - Metz', lat: 49.1193, lng: 6.1757, dept: '57', commune: 'Metz', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'COARSE' as const, 'SHORE' as const] },
  { name: 'Hérault - Agde', lat: 43.3108, lng: 3.4597, dept: '34', commune: 'Agde', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'SURFCASTING' as const, 'SHORE' as const] },
  { name: 'Gave d\'Oloron', lat: 43.1932, lng: -0.6124, dept: '64', commune: 'Oloron-Sainte-Marie', water: 'RIVER' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const] },
  { name: 'Ain - Pont-d\'Ain', lat: 46.0500, lng: 5.3333, dept: '01', commune: 'Pont-d\'Ain', water: 'RIVER' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const, 'SHORE' as const] },
  { name: 'Drôme - Die', lat: 44.7522, lng: 5.3711, dept: '26', commune: 'Die', water: 'RIVER' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const] },
  { name: 'Charente - Angoulême', lat: 45.6500, lng: 0.1556, dept: '16', commune: 'Angoulême', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'SPINNING' as const, 'SHORE' as const] },
  { name: 'Marne - Épernay', lat: 49.0400, lng: 3.9500, dept: '51', commune: 'Épernay', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'CARP' as const, 'SHORE' as const] },
  { name: 'Ariège - Foix', lat: 42.9642, lng: 1.6050, dept: '09', commune: 'Foix', water: 'RIVER' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const] },
  { name: 'Sorgue - Fontaine-de-Vaucluse', lat: 43.9200, lng: 5.1300, dept: '84', commune: 'Fontaine-de-Vaucluse', water: 'RIVER' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const] },
  { name: 'Aude - Carcassonne', lat: 43.2128, lng: 2.3517, dept: '11', commune: 'Carcassonne', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'COARSE' as const, 'SHORE' as const] },
  { name: 'Yonne - Auxerre', lat: 47.7979, lng: 3.5714, dept: '89', commune: 'Auxerre', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'SPINNING' as const, 'CARP' as const] },
  { name: 'Oise - Compiègne', lat: 49.4178, lng: 2.8263, dept: '60', commune: 'Compiègne', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'CARP' as const, 'SHORE' as const] },
  { name: 'Nive - Bayonne', lat: 43.4833, lng: -1.4833, dept: '64', commune: 'Bayonne', water: 'RIVER' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const] },

  // --- Torrents / Ruisseaux ---
  { name: 'Verdon - Castellane', lat: 43.8500, lng: 6.5167, dept: '04', commune: 'Castellane', water: 'STREAM' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const] },
  { name: 'Ubaye - Barcelonnette', lat: 44.3833, lng: 6.6500, dept: '04', commune: 'Barcelonnette', water: 'STREAM' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const] },
  { name: 'Neste d\'Aure', lat: 42.8833, lng: 0.3833, dept: '65', commune: 'Arreau', water: 'STREAM' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const] },

  // --- Canaux ---
  { name: 'Canal du Midi - Toulouse', lat: 43.6047, lng: 1.4442, dept: '31', commune: 'Toulouse', water: 'CANAL' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'CARP' as const, 'SHORE' as const] },
  { name: 'Canal de Bourgogne - Dijon', lat: 47.3220, lng: 5.0415, dept: '21', commune: 'Dijon', water: 'CANAL' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'CARP' as const, 'SHORE' as const] },
  { name: 'Canal latéral à la Loire - Nevers', lat: 46.9897, lng: 3.1589, dept: '58', commune: 'Nevers', water: 'CANAL' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'CARP' as const, 'SHORE' as const] },
  { name: 'Canal du Rhône au Rhin - Mulhouse', lat: 47.7508, lng: 7.3359, dept: '68', commune: 'Mulhouse', water: 'CANAL' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'CARP' as const, 'SHORE' as const] },
  { name: 'Canal de la Marne au Rhin - Strasbourg', lat: 48.5734, lng: 7.7521, dept: '67', commune: 'Strasbourg', water: 'CANAL' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'SPINNING' as const, 'SHORE' as const] },

  // --- Étangs ---
  { name: 'Étang de Berre', lat: 43.4449, lng: 5.1067, dept: '13', commune: 'Martigues', water: 'POND' as const, cat: 'SECOND' as const, types: ['SURFCASTING' as const, 'SHORE' as const] },
  { name: 'Étang de Thau', lat: 43.4167, lng: 3.6167, dept: '34', commune: 'Sète', water: 'POND' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const, 'BOAT' as const] },
  { name: 'Étang de Biscarrosse', lat: 44.4167, lng: -1.1667, dept: '40', commune: 'Biscarrosse', water: 'POND' as const, cat: 'SECOND' as const, types: ['CARP' as const, 'SPINNING' as const, 'BOAT' as const] },
  { name: 'Étang de la Forêt - Concarneau', lat: 47.8667, lng: -3.8833, dept: '29', commune: 'Concarneau', water: 'POND' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'CARP' as const, 'SHORE' as const] },
  { name: 'Étangs de la Dombes', lat: 46.0000, lng: 5.0333, dept: '01', commune: 'Villars-les-Dombes', water: 'POND' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'CARP' as const, 'SHORE' as const] },
  { name: 'Étang de Lindre', lat: 48.8167, lng: 6.7500, dept: '57', commune: 'Lindre-Basse', water: 'POND' as const, cat: 'SECOND' as const, types: ['CARP' as const, 'COARSE' as const, 'BOAT' as const] },

  // --- Mer ---
  { name: 'Baie de Somme', lat: 50.2050, lng: 1.6282, dept: '80', commune: 'Le Crotoy', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const] },
  { name: 'Cap Fréhel - Plévenon', lat: 48.6833, lng: -2.3167, dept: '22', commune: 'Plévenon', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const] },
  { name: 'Pointe du Raz - Plogoff', lat: 48.0375, lng: -4.7333, dept: '29', commune: 'Plogoff', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const] },
  { name: 'Cassis - Calanques', lat: 43.2147, lng: 5.5389, dept: '13', commune: 'Cassis', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const, 'BOAT' as const] },
  { name: 'Saint-Jean-de-Luz', lat: 43.3883, lng: -1.6603, dept: '64', commune: 'Saint-Jean-de-Luz', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'BOAT' as const, 'SHORE' as const] },
  { name: 'Île d\'Oléron - Côte Sauvage', lat: 45.9500, lng: -1.3167, dept: '17', commune: 'Saint-Pierre-d\'Oléron', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const] },
  { name: 'Gruissan Plage', lat: 43.1000, lng: 3.0833, dept: '11', commune: 'Gruissan', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const] },
  { name: 'Dieppe - Jetée', lat: 49.9300, lng: 1.0800, dept: '76', commune: 'Dieppe', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const] },
  { name: 'Boulogne-sur-Mer - Digue', lat: 50.7264, lng: 1.6147, dept: '62', commune: 'Boulogne-sur-Mer', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const, 'BOAT' as const] },
  { name: 'Palavas-les-Flots - Grau', lat: 43.5281, lng: 3.9278, dept: '34', commune: 'Palavas-les-Flots', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const] },
  { name: 'Port-en-Bessin', lat: 49.3500, lng: -0.7500, dept: '14', commune: 'Port-en-Bessin-Huppain', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'BOAT' as const, 'SHORE' as const] },
  { name: 'Les Sables-d\'Olonne - Jetée', lat: 46.4978, lng: -1.7900, dept: '85', commune: 'Les Sables-d\'Olonne', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const, 'BOAT' as const] },
  { name: 'Arcachon - Jetée Thiers', lat: 44.6594, lng: -1.1681, dept: '33', commune: 'Arcachon', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const, 'BOAT' as const] },
  { name: 'Sanary-sur-Mer', lat: 43.1167, lng: 5.8000, dept: '83', commune: 'Sanary-sur-Mer', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'BOAT' as const, 'SHORE' as const] },
  { name: 'Carnac - Plage', lat: 47.5833, lng: -3.0833, dept: '56', commune: 'Carnac', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const] },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('Seeding database...');

  // Create user
  const user = await prisma.user.upsert({
    where: { email: 'demo@fishspot.fr' },
    update: {},
    create: {
      email: 'demo@fishspot.fr',
      name: 'Pêcheur Demo',
      username: 'pecheur_demo',
      level: 5,
      xp: 1250,
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create fish species with FishBase enrichment
  for (const species of FISH_SPECIES) {
    const fb = FISHBASE_DATA[species.scientificName] ?? null;
    const fishbaseFields = {
      maxLengthCm: fb?.maxLengthCm ?? null,
      maxWeightKg: fb?.maxWeightKg ?? null,
      optimalTempMin: fb?.optimalTempMin ?? null,
      optimalTempMax: fb?.optimalTempMax ?? null,
      feedingType: fb?.feedingType ?? null,
      habitat: fb?.habitat ?? null,
      spawnMonthStart: fb?.spawnMonthStart ?? null,
      spawnMonthEnd: fb?.spawnMonthEnd ?? null,
    };

    await prisma.fishSpecies.upsert({
      where: { name: species.name },
      update: fishbaseFields,
      create: { ...species, ...fishbaseFields },
    });
  }

  console.log(`Created ${FISH_SPECIES.length} fish species (with FishBase data)`);

  // Create spots
  for (const spot of SPOTS) {
    const slug = slugify(spot.name);
    await prisma.spot.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: spot.name,
        description: `Spot de pêche situé à ${spot.commune} dans le département ${spot.dept}. Un lieu apprécié des pêcheurs locaux.`,
        latitude: spot.lat,
        longitude: spot.lng,
        department: spot.dept,
        commune: spot.commune,
        waterType: spot.water,
        waterCategory: spot.cat,
        fishingTypes: spot.types,
        status: 'APPROVED',
        isVerified: true,
        averageRating: Math.round((3 + Math.random() * 2) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 30) + 1,
        viewCount: Math.floor(Math.random() * 500) + 10,
        authorId: user.id,
      },
    });
  }

  console.log(`Created ${SPOTS.length} spots`);
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
