import * as SQLite from 'expo-sqlite';
import type { SpotListItem } from '@fish-point/shared';

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

const db = SQLite.openDatabaseSync('fishpoint.db');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PendingCatch {
  clientId: string;
  data: Record<string, unknown>;
  createdAt: number;
}

export interface CachedSpecies {
  id: string;
  name: string;
  category: string;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

/**
 * Create tables if they don't exist yet.
 * Call once at app startup (e.g. in the root layout).
 */
export function initDatabase(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS pending_catches (
      client_id TEXT PRIMARY KEY NOT NULL,
      data     TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS cached_species (
      id       TEXT PRIMARY KEY NOT NULL,
      name     TEXT NOT NULL,
      category TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS cached_spots (
      id               TEXT PRIMARY KEY NOT NULL,
      slug             TEXT NOT NULL,
      name             TEXT NOT NULL,
      latitude         REAL NOT NULL,
      longitude        REAL NOT NULL,
      department       TEXT NOT NULL,
      commune          TEXT,
      water_type       TEXT NOT NULL,
      water_category   TEXT,
      fishing_types    TEXT NOT NULL,
      average_rating   REAL NOT NULL,
      review_count     INTEGER NOT NULL,
      is_premium       INTEGER NOT NULL DEFAULT 0,
      is_verified      INTEGER NOT NULL DEFAULT 0,
      primary_image    TEXT,
      fishability_score REAL,
      data_origin      TEXT NOT NULL
    );
  `);
}

// ---------------------------------------------------------------------------
// Pending Catches
// ---------------------------------------------------------------------------

/** Queue a catch for later sync. */
export function addPendingCatch(
  clientId: string,
  data: Record<string, unknown>,
): void {
  db.runSync(
    `INSERT OR REPLACE INTO pending_catches (client_id, data, created_at)
     VALUES (?, ?, ?)`,
    clientId,
    JSON.stringify(data),
    Date.now(),
  );
}

/** Retrieve every pending catch, oldest first. */
export function getPendingCatches(): PendingCatch[] {
  const rows = db.getAllSync<{ client_id: string; data: string; created_at: number }>(
    'SELECT client_id, data, created_at FROM pending_catches ORDER BY created_at ASC',
  );

  return rows.map((row) => ({
    clientId: row.client_id,
    data: JSON.parse(row.data) as Record<string, unknown>,
    createdAt: row.created_at,
  }));
}

/** Remove a single pending catch after it has been synced. */
export function removePendingCatch(clientId: string): void {
  db.runSync('DELETE FROM pending_catches WHERE client_id = ?', clientId);
}

/** Remove all pending catches. */
export function clearPendingCatches(): void {
  db.runSync('DELETE FROM pending_catches');
}

/** Fast count without deserialising rows. */
export function getPendingCatchCount(): number {
  const row = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM pending_catches',
  );
  return row?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Cached Spots
// ---------------------------------------------------------------------------

/** Upsert a spot into the local cache for offline viewing. */
export function cacheSpot(spot: SpotListItem): void {
  db.runSync(
    `INSERT OR REPLACE INTO cached_spots
       (id, slug, name, latitude, longitude, department, commune,
        water_type, water_category, fishing_types, average_rating,
        review_count, is_premium, is_verified, primary_image,
        fishability_score, data_origin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    spot.id,
    spot.slug,
    spot.name,
    spot.latitude,
    spot.longitude,
    spot.department,
    spot.commune ?? null,
    spot.waterType,
    spot.waterCategory ?? null,
    JSON.stringify(spot.fishingTypes),
    spot.averageRating,
    spot.reviewCount,
    spot.isPremium ? 1 : 0,
    spot.isVerified ? 1 : 0,
    spot.primaryImage ?? null,
    spot.fishabilityScore ?? null,
    spot.dataOrigin,
  );
}

/** Retrieve all locally-cached spots. */
export function getCachedSpots(): SpotListItem[] {
  const rows = db.getAllSync<{
    id: string;
    slug: string;
    name: string;
    latitude: number;
    longitude: number;
    department: string;
    commune: string | null;
    water_type: string;
    water_category: string | null;
    fishing_types: string;
    average_rating: number;
    review_count: number;
    is_premium: number;
    is_verified: number;
    primary_image: string | null;
    fishability_score: number | null;
    data_origin: string;
  }>('SELECT * FROM cached_spots ORDER BY name ASC');

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    department: row.department,
    commune: row.commune,
    waterType: row.water_type as SpotListItem['waterType'],
    waterCategory: (row.water_category ?? null) as SpotListItem['waterCategory'],
    fishingTypes: JSON.parse(row.fishing_types) as SpotListItem['fishingTypes'],
    averageRating: row.average_rating,
    reviewCount: row.review_count,
    isPremium: row.is_premium === 1,
    isVerified: row.is_verified === 1,
    primaryImage: row.primary_image,
    fishabilityScore: row.fishability_score,
    dataOrigin: row.data_origin,
  }));
}

/** Drop all cached spots. */
export function clearCachedSpots(): void {
  db.runSync('DELETE FROM cached_spots');
}

// ---------------------------------------------------------------------------
// Cached Species
// ---------------------------------------------------------------------------

/**
 * Bulk-insert (or replace) a list of species into the local cache.
 * The entire operation runs in a single transaction.
 */
export function cacheSpecies(
  species: CachedSpecies[],
): void {
  db.execSync('BEGIN TRANSACTION');
  try {
    for (const s of species) {
      db.runSync(
        `INSERT OR REPLACE INTO cached_species (id, name, category)
         VALUES (?, ?, ?)`,
        s.id,
        s.name,
        s.category,
      );
    }
    db.execSync('COMMIT');
  } catch (error) {
    db.execSync('ROLLBACK');
    throw error;
  }
}

/** Retrieve all locally-cached species. */
export function getCachedSpecies(): CachedSpecies[] {
  return db.getAllSync<CachedSpecies>(
    'SELECT id, name, category FROM cached_species ORDER BY name ASC',
  );
}
