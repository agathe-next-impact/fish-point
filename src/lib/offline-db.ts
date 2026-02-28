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
}

const DB_NAME = 'fish-point';
const DB_VERSION = 1;

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
