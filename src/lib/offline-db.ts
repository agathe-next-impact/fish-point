import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface FishSpotDB extends DBSchema {
  pendingCatches: {
    key: string; // clientId
    value: {
      clientId: string;
      data: Record<string, unknown>;
      createdAt: number;
    };
  };
  cachedSpecies: {
    key: string;
    value: { id: string; name: string; category: string };
  };
  /**
   * Spots enregistrés par un visiteur NON connecté.
   * Valeur immédiate avant tout login : le compte sert ensuite à sync/alertes,
   * pas avant la 1re valeur (cf. spot-experience-architect — enregistrement immédiat).
   */
  savedSpots: {
    key: string; // spotId
    value: SavedSpotRecord;
  };
}

/** Spot enregistré localement par un invité (sous-ensemble suffisant pour l'afficher). */
export interface SavedSpotRecord {
  spotId: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  savedAt: number;
}

const DB_NAME = 'fish-point';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<FishSpotDB>> | null = null;

function getDB(): Promise<IDBPDatabase<FishSpotDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FishSpotDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pendingCatches')) {
          db.createObjectStore('pendingCatches', { keyPath: 'clientId' });
        }
        if (!db.objectStoreNames.contains('cachedSpecies')) {
          db.createObjectStore('cachedSpecies', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('savedSpots')) {
          db.createObjectStore('savedSpots', { keyPath: 'spotId' });
        }
      },
    });
  }
  return dbPromise;
}

// ─── Pending Catches ────────────────────────────────────────────

export async function addPendingCatch(
  clientId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const db = await getDB();
  await db.put('pendingCatches', {
    clientId,
    data,
    createdAt: Date.now(),
  });
}

export async function getPendingCatches(): Promise<
  { clientId: string; data: Record<string, unknown>; createdAt: number }[]
> {
  const db = await getDB();
  return db.getAll('pendingCatches');
}

export async function removePendingCatch(clientId: string): Promise<void> {
  const db = await getDB();
  await db.delete('pendingCatches', clientId);
}

export async function clearPendingCatches(): Promise<void> {
  const db = await getDB();
  await db.clear('pendingCatches');
}

// ─── Cached Species ─────────────────────────────────────────────

export async function cacheSpecies(
  species: { id: string; name: string; category: string }[],
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('cachedSpecies', 'readwrite');
  for (const s of species) {
    await tx.store.put(s);
  }
  await tx.done;
}

export async function getCachedSpecies(): Promise<
  { id: string; name: string; category: string }[]
> {
  const db = await getDB();
  return db.getAll('cachedSpecies');
}

// ─── Saved Spots (visiteur non connecté) ────────────────────────

/** Enregistre un spot en local (save invité, valeur immédiate avant login). */
export async function addSavedSpot(
  record: Omit<SavedSpotRecord, 'savedAt'>,
): Promise<void> {
  const db = await getDB();
  await db.put('savedSpots', { ...record, savedAt: Date.now() });
}

/** Retire un spot enregistré localement (Annuler / bascule). */
export async function removeSavedSpot(spotId: string): Promise<void> {
  const db = await getDB();
  await db.delete('savedSpots', spotId);
}

/** `true` si le spot est déjà enregistré localement. */
export async function isSavedSpot(spotId: string): Promise<boolean> {
  const db = await getDB();
  return (await db.getKey('savedSpots', spotId)) !== undefined;
}

/** Liste les spots enregistrés localement (pour l'espace « Enregistrés »). */
export async function getSavedSpots(): Promise<SavedSpotRecord[]> {
  const db = await getDB();
  return db.getAll('savedSpots');
}

/**
 * Vide tous les spots enregistrés localement.
 * Appelé après une fusion réussie invité → compte (les saves sont désormais
 * persistés côté serveur, le local n'a plus de raison d'être).
 */
export async function clearSavedSpots(): Promise<void> {
  const db = await getDB();
  await db.clear('savedSpots');
}
