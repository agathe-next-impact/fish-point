'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useNotificationStore } from '@/store/notification.store';
import { cn } from '@/lib/utils';
import {
  addSavedSpot,
  removeSavedSpot,
  isSavedSpot,
} from '@/lib/offline-db';

/** Données minimales nécessaires pour enregistrer un spot (connecté ou invité). */
export interface SaveSpotTarget {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface SaveSpotButtonProps {
  spot: SaveSpotTarget;
  /** `compact` = icône seule (popup carte) ; `default` = icône + libellé (carte de liste / fiche). */
  variant?: 'default' | 'compact';
  className?: string;
}

const LIST_NAME = 'default';

/**
 * Bouton « Enregistrer » réutilisable et optimiste.
 *
 * - Connecté → persistance serveur réelle via /api/spots/favorites (POST/DELETE, modèle Favorite).
 * - Invité   → enregistrement local réel via offline-db (valeur immédiate AVANT login,
 *              pas de mur de connexion au 1er clic).
 *
 * Toast de confirmation à chaque action : le save propose un lien « Annuler » dédié dans le
 * toast (retrait immédiat) ; recliquer le bouton bascule aussi Enregistré → retiré.
 * A11y : aria-pressed, libellé explicite, focusable au clavier.
 */
export function SaveSpotButton({ spot, variant = 'default', className }: SaveSpotButtonProps) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const addToast = useNotificationStore((s) => s.addToast);

  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  // État initial : serveur (connecté) ou IndexedDB (invité).
  useEffect(() => {
    let cancelled = false;

    async function hydrate(): Promise<void> {
      try {
        if (isAuthenticated) {
          const res = await fetch('/api/spots/favorites');
          if (!res.ok) return;
          const json: { data: Array<{ spotId: string }> } = await res.json();
          if (!cancelled) {
            setSaved(json.data.some((f) => f.spotId === spot.id));
          }
        } else {
          const local = await isSavedSpot(spot.id);
          if (!cancelled) setSaved(local);
        }
      } catch {
        // Lecture best-effort : on laisse l'état par défaut (non enregistré).
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, spot.id]);

  const persistSave = useCallback(async (): Promise<void> => {
    if (isAuthenticated) {
      const res = await fetch('/api/spots/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotId: spot.id, listName: LIST_NAME }),
      });
      if (!res.ok) throw new Error('save failed');
    } else {
      await addSavedSpot({
        spotId: spot.id,
        slug: spot.slug,
        name: spot.name,
        latitude: spot.latitude,
        longitude: spot.longitude,
      });
    }
  }, [isAuthenticated, spot]);

  const persistRemove = useCallback(async (): Promise<void> => {
    if (isAuthenticated) {
      const res = await fetch('/api/spots/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotId: spot.id, listName: LIST_NAME }),
      });
      if (!res.ok) throw new Error('remove failed');
    } else {
      await removeSavedSpot(spot.id);
    }
  }, [isAuthenticated, spot.id]);

  /** Retire le spot (bascule du bouton OU lien « Annuler » du toast). Idempotent côté UI. */
  const handleRemove = useCallback(async () => {
    setSaved(false); // optimiste
    setPending(true);
    try {
      await persistRemove();
      addToast({ type: 'info', title: 'Retiré des enregistrés' });
    } catch {
      setSaved(true); // rollback
      addToast({
        type: 'error',
        title: 'Action impossible',
        description: 'Réessayez dans un instant.',
      });
    } finally {
      setPending(false);
    }
  }, [persistRemove, addToast]);

  const handleSave = useCallback(async () => {
    setSaved(true); // optimiste
    setPending(true);
    try {
      await persistSave();
      addToast({
        type: 'success',
        title: 'Enregistré',
        description: 'Retrouvez-le dans vos spots enregistrés.',
        action: { label: 'Annuler', onClick: () => void handleRemove() },
      });
    } catch {
      setSaved(false); // rollback
      addToast({
        type: 'error',
        title: 'Action impossible',
        description: 'Réessayez dans un instant.',
      });
    } finally {
      setPending(false);
    }
  }, [persistSave, addToast, handleRemove]);

  const handleToggle = useCallback(() => {
    if (pending) return;
    return saved ? handleRemove() : handleSave();
  }, [pending, saved, handleSave, handleRemove]);

  const label = saved ? 'Enregistré' : 'Enregistrer';
  const Icon = saved ? BookmarkCheck : Bookmark;

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50',
          saved && 'border-primary text-fs-accent',
          className,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-pressed={saved}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50',
        saved && 'border-primary text-fs-accent',
        className,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden />
      {label}
    </button>
  );
}
