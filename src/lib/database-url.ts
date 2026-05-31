const DATABASE_URL_CANDIDATES = [
  'FISHPOINT_POSTGRES_PRISMA_URL',
  'FISHPOINT_DATABASE_URL',
  'FISHPOINT_POSTGRES_URL',
  'DATABASE_URL',
] as const;

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  for (const key of DATABASE_URL_CANDIDATES) {
    const value = env[key]?.trim();
    if (value) return value;
  }

  throw new Error(
    `Missing database URL. Set one of: ${DATABASE_URL_CANDIDATES.join(', ')}`
  );
}

