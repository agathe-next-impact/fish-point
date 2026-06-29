import { z } from 'zod';

const optionalUrl = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.string().url().optional()
);

const envSchema = z.object({
  DATABASE_URL: optionalUrl,
  FISHPOINT_DATABASE_URL: optionalUrl,
  FISHPOINT_POSTGRES_PRISMA_URL: optionalUrl,
  FISHPOINT_POSTGRES_URL: optionalUrl,
  NEXTAUTH_URL: optionalUrl,
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NEXT_PUBLIC_MAP_PROVIDER: z.enum(['mapbox', 'maplibre']).default('maplibre'),
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  NEXT_PUBLIC_PMTILES_URL: optionalUrl,
  NEXT_PUBLIC_PMTILES_FILE: z.string().min(1).optional(),
  OPENWEATHERMAP_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: optionalUrl.default('http://localhost:3000'),
}).refine(
  (env) =>
    Boolean(
      env.FISHPOINT_POSTGRES_PRISMA_URL ||
      env.FISHPOINT_DATABASE_URL ||
      env.FISHPOINT_POSTGRES_URL ||
      env.DATABASE_URL
    ),
  {
    message:
      'Set one database URL: FISHPOINT_POSTGRES_PRISMA_URL, FISHPOINT_DATABASE_URL, FISHPOINT_POSTGRES_URL, or DATABASE_URL',
    path: ['DATABASE_URL'],
  }
);

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  return result.data;
}
