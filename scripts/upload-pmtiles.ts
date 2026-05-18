/**
 * Upload a local PMTiles file to Vercel Blob.
 *
 * Prerequisites:
 *   1. A Vercel Blob store exists for this project (created once via the
 *      Vercel dashboard → Storage → Blob → Create store).
 *   2. The following env vars are set (in `.env.local`):
 *        - BLOB_READ_WRITE_TOKEN  (provided automatically by `vercel env pull`)
 *   3. The PMTiles file is downloaded locally. Default expected path:
 *        ./tiles/france.pmtiles
 *      Download from https://app.protomaps.com (draw France, then download).
 *
 * Usage:
 *   npm run upload-tiles
 *   npm run upload-tiles -- ./path/to/file.pmtiles --key=france.pmtiles
 *
 * After upload, the script prints the public URL — paste it into
 * `NEXT_PUBLIC_PMTILES_URL` (without the trailing `/france.pmtiles`).
 */

import { createReadStream, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { put, head } from '@vercel/blob';

try {
  process.loadEnvFile('.env.local');
} catch {
  // .env.local optional — env vars may already be set (e.g. CI)
}

const DEFAULT_LOCAL_PATH = './tiles/france.pmtiles';
const DEFAULT_KEY = 'france.pmtiles';

function parseArgs(argv: string[]): { localPath: string; key: string } {
  const positional = argv.filter((a) => !a.startsWith('--'));
  const flags = Object.fromEntries(
    argv
      .filter((a) => a.startsWith('--'))
      .map((a) => {
        const [k, v] = a.replace(/^--/, '').split('=');
        return [k, v ?? 'true'];
      }),
  );
  return {
    localPath: positional[0] ?? DEFAULT_LOCAL_PATH,
    key: flags.key ?? DEFAULT_KEY,
  };
}

async function main(): Promise<void> {
  const { localPath, key } = parseArgs(process.argv.slice(2));
  const absPath = resolve(localPath);

  let size: number;
  try {
    size = statSync(absPath).size;
  } catch {
    console.error(`File not found: ${absPath}`);
    console.error('Download a PMTiles extract from https://app.protomaps.com');
    process.exit(1);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Missing BLOB_READ_WRITE_TOKEN.');
    console.error('Pull it from Vercel: `vercel env pull .env.local`');
    process.exit(1);
  }

  const sizeMb = (size / 1024 / 1024).toFixed(1);
  console.log(`Uploading ${absPath} (${sizeMb} MB) → Vercel Blob (key=${key})`);
  console.log('Using multipart streaming upload (handles files > 2 GB)...');

  const stream = createReadStream(absPath);
  const startedAt = Date.now();

  const result = await put(key, stream, {
    access: 'public',
    contentType: 'application/octet-stream',
    cacheControlMaxAge: 31536000,
    addRandomSuffix: false,
    allowOverwrite: true,
    multipart: true,
  });

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log(`Done in ${elapsed}s.`);
  console.log(`URL:        ${result.url}`);
  console.log(`Pathname:   ${result.pathname}`);

  const meta = await head(result.url);
  console.log(`Size:       ${meta.size} bytes`);
  console.log(`CacheCtrl:  ${meta.cacheControl ?? '(none)'}`);

  const baseUrl = result.url.replace(`/${key}`, '');
  console.log('\nNext steps:');
  console.log(`  1. Set in .env.local:`);
  console.log(`       NEXT_PUBLIC_PMTILES_URL="${baseUrl}"`);
  console.log(`  2. Set the same value in Vercel project env vars (Preview + Production)`);
  console.log(`  3. For mobile, set EXPO_PUBLIC_PMTILES_URL to the same URL`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
