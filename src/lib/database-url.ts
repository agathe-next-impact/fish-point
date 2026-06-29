const DATABASE_URL_CANDIDATES = [
  'FISHPOINT_POSTGRES_PRISMA_URL',
  'FISHPOINT_DATABASE_URL',
  'FISHPOINT_POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'DATABASE_URL',
] as const;

const MIGRATION_DATABASE_URL_CANDIDATES = [
  'FISHPOINT_POSTGRES_URL_NON_POOLING',
  'FISHPOINT_DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
  'DATABASE_URL_UNPOOLED',
] as const;

const MIGRATION_DATABASE_URL_FALLBACK_CANDIDATES = [
  'FISHPOINT_POSTGRES_URL',
  'FISHPOINT_DATABASE_URL',
  'POSTGRES_URL',
  'FISHPOINT_POSTGRES_PRISMA_URL',
  'POSTGRES_PRISMA_URL',
  'DATABASE_URL',
] as const;

function getFirstDefinedUrl(
  candidates: readonly string[],
  env: NodeJS.ProcessEnv,
): string | null {
  for (const key of candidates) {
    const value = env[key]?.trim();
    if (value) return value;
  }

  return null;
}

function getNeonDirectUrlFromPooler(value: string): string | null {
  try {
    const url = new URL(value);
    if (!url.hostname.includes('-pooler.')) return null;

    url.hostname = url.hostname.replace('-pooler.', '.');
    url.searchParams.delete('pgbouncer');
    return url.toString();
  } catch {
    return null;
  }
}

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const value = getFirstDefinedUrl(DATABASE_URL_CANDIDATES, env);
  if (value) return value;

  throw new Error(
    `Missing database URL. Set one of: ${DATABASE_URL_CANDIDATES.join(', ')}`
  );
}

export function getMigrationDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const value = getFirstDefinedUrl(MIGRATION_DATABASE_URL_CANDIDATES, env);
  if (value) return value;

  const fallback = getFirstDefinedUrl(MIGRATION_DATABASE_URL_FALLBACK_CANDIDATES, env);
  if (fallback) {
    return getNeonDirectUrlFromPooler(fallback) ?? fallback;
  }

  throw new Error(
    `Missing migration database URL. Set one of: ${[
      ...MIGRATION_DATABASE_URL_CANDIDATES,
      ...MIGRATION_DATABASE_URL_FALLBACK_CANDIDATES,
    ].join(', ')}`
  );
}
