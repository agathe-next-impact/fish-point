import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { getMigrationDatabaseUrl } from './src/lib/database-url';

// Align with Next.js convention: load .env then let .env.local override.
loadEnv();
loadEnv({ path: '.env.local', override: true });

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: getMigrationDatabaseUrl(),
  },
});
