'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bookmark, BookmarkCheck, ChevronDown, Plus } from 'lucide-react';
import { useNotificationStore } from '@/store/notification.store';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown';
import {
  DEFAULT_LIST_NAME,
  SUGGESTED_COLLECTIONS,
  normalizeListName,
} from '@/lib/collections';
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

/**
 * Bouton « Enregistrer » réutilisable et optimiste, avec sélecteur de collection.
 *
 * - Connecté → persistance serveur réelle via /api/spots/favorites (POST/DELETE, modèle Favorite).
 *   Le clic principal enregistre dans la collection par défaut (« Favoris ») ; un menu
 *   adjacent permet de choisir une autre collection ou d'en créer une (valeur `listName`).
 * - Invité   → enregistrement local réel via offline-db (valeur immédiate AVANT login,
 *              pas de mur de connexion). Pas de collections serveur côté invité.
 *
 * Le comportement 1-clic est préservé : aucun choix imposé, le défaut suffit.
 * A11y : aria-pressed, libellés explicites, menu Radix navigable au clavier.
 */
export function SaveSpotButton({ spot, variant = 'default', className }: SaveSpotButtonProps) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const addToast = useNotificationStore((s) => s.addToast);

  /** Collections (`listName`) où ce spot est enregistré. Vide = non enregistré. */
  const [savedLists, setSavedLists] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const saved = savedLists.size > 0;

  // État initial : serveur (connecté, toutes collections confondues) ou IndexedDB (invité).
  useEffect(() => {
    let cancelled = false;

    async function hydrate(): Promise<void> {
      try {
        if (isAuthenticated) {
          const res = await fetch('/api/spots/favorites');
          if (!res.ok) return;
          const json: { data: Array<{ spotId: string; listName?: string | null }> } = await res.json();
          if (!cancelled) {
            const lists = json.data
              .filter((f) => f.spotId === spot.id)
              .map((f) => (f.listName && f.listName.length > 0 ? f.listName : DEFAULT_LIST_NAME));
            setSavedLists(new Set(lists));
          }
        } else {
          const local = await isSavedSpot(spot.id);
          if (!cancelled) setSavedLists(local ? new Set([DEFAULT_LIST_NAME]) : new Set());
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

  const persistSave = useCallback(
    async (listName: string): Promise<void> => {
      if (isAuthenticated) {
        const res = await fetch('/api/spots/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spotId: spot.id, listName }),
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
    },
    [isAuthenticated, spot],
  );

  const persistRemove = useCallback(
    async (listName: string): Promise<void> => {
      if (isAuthenticated) {
        const res = await fetch('/api/spots/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spotId: spot.id, listName }),
        });
        if (!res.ok) throw new Error('remove failed');
      } else {
        await removeSavedSpot(spot.id);
      }
    },
    [isAuthenticated, spot.id],
  );

  /** Retire le spot d'UNE collection (bascule du bouton OU « Annuler » du toast). */
  const handleRemove = useCallback(
    async (listName: string) => {
      setSavedLists((prev) => {
        const next = new Set(prev);
        next.delete(listName);
        return next;
      });
      setPending(true);
      try {
        await persistRemove(listName);
        addToast({ type: 'info', title: 'Retiré des enregistrés' });
      } catch {
        setSavedLists((prev) => new Set(prev).add(listName)); // rollback
        addToast({
          type: 'error',
          title: 'Action impossible',
          description: 'Réessayez dans un instant.',
        });
      } finally {
        setPending(false);
      }
    },
    [persistRemove, addToast],
  );

  /** Enregistre le spot dans une collection donnée (défaut si non précisé). */
  const handleSave = useCallback(
    async (listName: string = DEFAULT_LIST_NAME) => {
      const normalized = normalizeListName(listName);
      setSavedLists((prev) => new Set(prev).add(normalized)); // optimiste
      setPending(true);
      try {
        await persistSave(normalized);
        addToast({
          type: 'success',
          title: 'Enregistré',
          description: 'Retrouvez-le dans vos spots enregistrés.',
          action: { label: 'Annuler', onClick: () => void handleRemove(normalized) },
        });
      } catch {
        setSavedLists((prev) => {
          const next = new Set(prev);
          next.delete(normalized);
          return next;
        }); // rollback
        addToast({
          type: 'error',
          title: 'Action impossible',
          description: 'Réessayez dans un instant.',
        });
      } finally {
        setPending(false);
      }
    },
    [persistSave, addToast, handleRemove],
  );

  /** Bascule rapide : 1er clic enregistre dans le défaut, reclic retire tout. */
  const handleToggle = useCallback(() => {
    if (pending) return;
    if (saved) {
      // Retire de toutes les collections où il est présent (geste « tout retirer »).
      for (const listName of savedLists) void handleRemove(listName);
      return;
    }
    return handleSave(DEFAULT_LIST_NAME);
  }, [pending, saved, savedLists, handleSave, handleRemove]);

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

  // Variant `default`. Connecté : split-button (toggle + menu collections).
  // Invité : bouton simple (pas de collections serveur).
  const toggleButton = (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-pressed={saved}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-1.5 border border-input bg-background px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50',
        isAuthenticated ? 'rounded-l-md border-r-0' : 'rounded-md',
        saved && 'border-primary text-fs-accent',
        !isAuthenticated && className,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden />
      {label}
    </button>
  );

  if (!isAuthenticated) {
    return toggleButton;
  }

  return (
    <div className={cn('inline-flex', className)}>
      {toggleButton}
      <CollectionMenu
        savedLists={savedLists}
        pending={pending}
        onSave={handleSave}
        onRemove={handleRemove}
      />
    </div>
  );
}

interface CollectionMenuProps {
  savedLists: Set<string>;
  pending: boolean;
  onSave: (listName: string) => void | Promise<void>;
  onRemove: (listName: string) => void | Promise<void>;
}

/**
 * Menu de choix de collection (utilisateur connecté). Liste les collections
 * suggérées avec leur état (enregistré / non), plus un champ pour en créer une.
 * Coche = présent dans la collection ; clic = bascule sur cette collection.
 */
function CollectionMenu({ savedLists, pending, onSave, onRemove }: CollectionMenuProps) {
  const [newName, setNewName] = useState('');

  const submitNew = useCallback(() => {
    const normalized = normalizeListName(newName);
    if (normalized === DEFAULT_LIST_NAME && newName.trim().length === 0) return;
    void onSave(normalized);
    setNewName('');
  }, [newName, onSave]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={pending}
          aria-label="Choisir une collection"
          className="inline-flex h-9 w-9 items-center justify-center rounded-r-md border border-input bg-background transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel>Enregistrer dans…</DropdownMenuLabel>
        {SUGGESTED_COLLECTIONS.map((collection) => {
          const isIn = savedLists.has(collection.listName);
          return (
            <DropdownMenuItem
              key={collection.listName}
              onSelect={(event) => {
                event.preventDefault();
                if (isIn) void onRemove(collection.listName);
                else void onSave(collection.listName);
              }}
              className="justify-between gap-3"
            >
              <span>{collection.label}</span>
              {isIn ? (
                <BookmarkCheck className="h-4 w-4 text-fs-accent" strokeWidth={2} aria-label="Enregistré ici" />
              ) : (
                <Bookmark className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.9} aria-hidden />
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="px-1 py-1">
          <label htmlFor="new-collection" className="sr-only">
            Nouvelle collection
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="new-collection"
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submitNew();
                }
              }}
              maxLength={60}
              placeholder="Nouvelle collection…"
              className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={submitNew}
              disabled={pending || newName.trim().length === 0}
              aria-label="Créer la collection et enregistrer"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-fs-accent text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
