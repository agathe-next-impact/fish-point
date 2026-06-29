'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { getSavedSpots, clearSavedSpots, type SavedSpotRecord } from '@/lib/offline-db';
import { DEFAULT_LIST_NAME } from '@/lib/collections';
import { useNotificationStore } from '@/store/notification.store';
import {
  mergeGuestFavorites,
  type GuestFavoriteRecord,
} from '@/lib/guest-favorites-merge';

/** POST un save invité vers le compte (idempotent côté serveur). Rejette si échec. */
async function postFavorite(record: GuestFavoriteRecord): Promise<void> {
  const res = await fetch('/api/spots/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spotId: record.spotId, listName: DEFAULT_LIST_NAME }),
  });
  if (!res.ok) throw new Error('merge favorite failed');
}

/**
 * Déclencheur SANS UI : monté en permanence sous les providers (Session + Query).
 * À la transition non-connecté → connecté, fusionne les spots enregistrés en invité
 * (IndexedDB) vers le compte, puis vide le local. Merge silencieux et idempotent.
 *
 * Run-once : un `useRef` garde la fusion pour ne la lancer qu'à la PREMIÈRE bascule
 * vers `authenticated`. L'idempotence de l'upsert serveur est le filet de sécurité
 * si l'effet rejoue (StrictMode) avant que la garde ne soit posée.
 *
 * Pas de `setState` dans cet effet (règle react-hooks/set-state-in-effect) : l'effet
 * ne fait qu'appeler une orchestration async et lire/écrire des refs.
 */
export function GuestFavoritesSync() {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const addToast = useNotificationStore((s) => s.addToast);
  const hasMerged = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || hasMerged.current) return;
    // Garde posée AVANT l'await : empêche un second run sur re-render concurrent.
    hasMerged.current = true;

    void (async () => {
      let records: SavedSpotRecord[];
      try {
        records = await getSavedSpots();
      } catch {
        // Lecture IndexedDB best-effort : on autorisera une nouvelle tentative.
        hasMerged.current = false;
        return;
      }

      if (records.length === 0) return; // cas courant : rien à fusionner

      const result = await mergeGuestFavorites({
        records,
        postFavorite,
        clearLocal: clearSavedSpots,
      });

      if (!result.cleared) {
        // Échec partiel : le local n'a PAS été vidé. On lèvera la garde pour
        // retenter à la prochaine occasion (re-render / nouvelle session).
        hasMerged.current = false;
        return;
      }

      // Tout est synchronisé : rafraîchir l'espace « Enregistrés » (source serveur).
      await queryClient.invalidateQueries({ queryKey: ['saved-spots', 'server'] });

      if (result.merged > 0) {
        addToast({
          type: 'success',
          title:
            result.merged === 1
              ? '1 spot synchronisé sur votre compte'
              : `${result.merged} spots synchronisés sur votre compte`,
        });
      }
    })();
  }, [status, queryClient, addToast]);

  return null;
}
