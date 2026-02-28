/**
 * Standalone enrichment script: updates all FishSpecies records
 * with FishBase data from src/config/fishbase-data.ts
 *
 * Usage: npx tsx scripts/enrich-fishbase.ts
 *
 * Safe to re-run: uses update, never deletes data.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { FISHBASE_DATA } from '../src/config/fishbase-data';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting FishBase enrichment...');

  const species = await prisma.fishSpecies.findMany({
    select: { id: true, name: true, scientificName: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const sp of species) {
    if (!sp.scientificName) {
      console.log(`  SKIP ${sp.name}: no scientificName`);
      skipped++;
      continue;
    }

    const data = FISHBASE_DATA[sp.scientificName];
    if (!data) {
      console.log(`  SKIP ${sp.name} (${sp.scientificName}): not in FishBase catalog`);
      skipped++;
      continue;
    }

    await prisma.fishSpecies.update({
      where: { id: sp.id },
      data: {
        maxLengthCm: data.maxLengthCm,
        maxWeightKg: data.maxWeightKg,
        optimalTempMin: data.optimalTempMin,
        optimalTempMax: data.optimalTempMax,
        feedingType: data.feedingType,
        habitat: data.habitat,
        spawnMonthStart: data.spawnMonthStart,
        spawnMonthEnd: data.spawnMonthEnd,
      },
    });

    console.log(`  OK ${sp.name}: enriched`);
    updated++;
  }

  console.log(`\nEnrichment complete: ${updated} updated, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
