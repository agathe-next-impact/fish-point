import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  { name: 'Lac du Bourget', lat: 45.7295, lng: 5.8613, dept: '73', commune: 'Le Bourget-du-Lac', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'BOAT' as const, 'SHORE' as const] },
  { name: 'Lac d\'Annecy', lat: 45.8614, lng: 6.1699, dept: '74', commune: 'Annecy', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'FLY' as const, 'SHORE' as const] },
  { name: 'Lac Léman - Thonon', lat: 46.3706, lng: 6.4792, dept: '74', commune: 'Thonon-les-Bains', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'TROLLING' as const, 'BOAT' as const] },
  { name: 'Rhône - Lyon Confluence', lat: 45.7404, lng: 4.8187, dept: '69', commune: 'Lyon', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'COARSE' as const, 'SHORE' as const] },
  { name: 'Gave de Pau - Nay', lat: 43.1786, lng: -0.2617, dept: '64', commune: 'Nay', water: 'RIVER' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const] },
  { name: 'Loire - Orléans', lat: 47.9029, lng: 1.9039, dept: '45', commune: 'Orléans', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'COARSE' as const, 'CARP' as const] },
  { name: 'Étang de Berre', lat: 43.4449, lng: 5.1067, dept: '13', commune: 'Martigues', water: 'POND' as const, cat: 'SECOND' as const, types: ['SURFCASTING' as const, 'SHORE' as const] },
  { name: 'Canal du Midi - Toulouse', lat: 43.6047, lng: 1.4442, dept: '31', commune: 'Toulouse', water: 'CANAL' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'CARP' as const, 'SHORE' as const] },
  { name: 'Lac de Serre-Ponçon', lat: 44.4997, lng: 6.3331, dept: '05', commune: 'Savines-le-Lac', water: 'RESERVOIR' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'BOAT' as const, 'FLOAT_TUBE' as const] },
  { name: 'Garonne - Bordeaux', lat: 44.8378, lng: -0.5792, dept: '33', commune: 'Bordeaux', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'SURFCASTING' as const, 'SHORE' as const] },
  { name: 'Lac de Vassivière', lat: 45.8039, lng: 1.8481, dept: '23', commune: 'Royère-de-Vassivière', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'CARP' as const, 'BOAT' as const] },
  { name: 'Dordogne - Bergerac', lat: 44.8534, lng: 0.4832, dept: '24', commune: 'Bergerac', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'FLY' as const, 'COARSE' as const] },
  { name: 'Lac de Madine', lat: 48.9167, lng: 5.7333, dept: '55', commune: 'Nonsard-Lamarche', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['CARP' as const, 'SPINNING' as const, 'SHORE' as const] },
  { name: 'Baie de Somme', lat: 50.2050, lng: 1.6282, dept: '80', commune: 'Le Crotoy', water: 'SEA' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const] },
  { name: 'Lac de Sainte-Croix', lat: 43.7697, lng: 6.1828, dept: '83', commune: 'Aiguines', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['SPINNING' as const, 'FLOAT_TUBE' as const, 'BOAT' as const] },
  { name: 'Seine - Paris', lat: 48.8566, lng: 2.3522, dept: '75', commune: 'Paris', water: 'RIVER' as const, cat: 'SECOND' as const, types: ['COARSE' as const, 'SPINNING' as const, 'SHORE' as const] },
  { name: 'Allier - Vichy', lat: 46.1245, lng: 3.4255, dept: '03', commune: 'Vichy', water: 'RIVER' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const] },
  { name: 'Lac d\'Orient', lat: 48.2667, lng: 4.2500, dept: '10', commune: 'Mesnil-Saint-Père', water: 'LAKE' as const, cat: 'SECOND' as const, types: ['CARP' as const, 'SPINNING' as const, 'BOAT' as const] },
  { name: 'Étang de Thau', lat: 43.4167, lng: 3.6167, dept: '34', commune: 'Sète', water: 'POND' as const, cat: null, types: ['SURFCASTING' as const, 'SHORE' as const, 'BOAT' as const] },
  { name: 'Doubs - Besançon', lat: 47.2378, lng: 6.0244, dept: '25', commune: 'Besançon', water: 'RIVER' as const, cat: 'FIRST' as const, types: ['FLY' as const, 'SPINNING' as const, 'COARSE' as const] },
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

  // Create fish species
  for (const species of FISH_SPECIES) {
    await prisma.fishSpecies.upsert({
      where: { name: species.name },
      update: {},
      create: species,
    });
  }

  console.log(`Created ${FISH_SPECIES.length} fish species`);

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
