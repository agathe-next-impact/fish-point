/**
 * Fusion des spots enregistrés en invité → compte, à la transition non-connecté →
 * connecté. « Le compte sert à la sync, pas avant la 1re valeur » : l'invité a déjà
 * enregistré des spots en local (IndexedDB) ; au login on les pousse vers son compte,
 * puis on vide le store local.
 *
 * Merge SILENCIEUX et IDEMPOTENT : aucun écran de réconciliation. Le POST favorites
 * est un upsert sur l'unique [userId, spotId, listName] (cf. route handler), donc
 * re-poster un spot déjà présent est sans effet — c'est le filet de sécurité contre
 * un double-run (StrictMode, double transition).
 *
 * Module volontairement PUR : aucune dépendance fetch / IndexedDB / React. Les effets
 * (POST, vidage du local) sont injectés, ce qui rend la logique testable sans I/O réel.
 */

/** Spot enregistré localement, réduit au strict nécessaire pour la fusion. */
export interface GuestFavoriteRecord {
  spotId: string;
}

export interface MergeGuestFavoritesDeps<R extends GuestFavoriteRecord> {
  /** Saves locaux à pousser. Vide → no-op (cas courant). */
  records: ReadonlyArray<R>;
  /**
   * Pousse UN save vers le compte (POST /api/spots/favorites, idempotent).
   * Doit rejeter (throw) si le POST échoue, pour comptabiliser l'échec partiel.
   */
  postFavorite: (record: R) => Promise<void>;
  /**
   * Vide le store local. Appelé UNIQUEMENT si TOUS les POST ont réussi, pour ne
   * jamais perdre un save non synchronisé (on retentera au prochain login).
   */
  clearLocal: () => Promise<void>;
}

export interface MergeGuestFavoritesResult {
  /** Nombre de saves poussés avec succès. */
  merged: number;
  /** Nombre de saves dont le POST a échoué (local conservé si > 0). */
  failed: number;
  /** `true` si le store local a été vidé (⇔ aucun échec et au moins un record). */
  cleared: boolean;
}

/**
 * Pousse chaque save invité vers le compte, puis vide le local si tout a réussi.
 *
 * Garanties :
 * - liste vide → `{ merged: 0, failed: 0, cleared: false }`, `clearLocal` non appelé ;
 * - tous les POST réussissent → `clearLocal` appelé une fois, `cleared: true` ;
 * - au moins un POST échoue → `clearLocal` NON appelé, `cleared: false`, `failed > 0`
 *   (les saves réussis restent upsertés côté serveur ; les échecs seront retentés
 *   au prochain login car le local n'est pas vidé — l'idempotence absorbe les doublons).
 *
 * Les POST sont séquentiels : N est petit (quota de saves invité) et cela évite une
 * rafale de requêtes concurrentes au moment sensible du login.
 */
export async function mergeGuestFavorites<R extends GuestFavoriteRecord>(
  deps: MergeGuestFavoritesDeps<R>,
): Promise<MergeGuestFavoritesResult> {
  const { records, postFavorite, clearLocal } = deps;

  if (records.length === 0) {
    return { merged: 0, failed: 0, cleared: false };
  }

  let merged = 0;
  let failed = 0;

  for (const record of records) {
    try {
      await postFavorite(record);
      merged += 1;
    } catch {
      // Échec best-effort : on continue les autres saves. Le local sera conservé.
      failed += 1;
    }
  }

  if (failed === 0) {
    await clearLocal();
    return { merged, failed, cleared: true };
  }

  return { merged, failed, cleared: false };
}
