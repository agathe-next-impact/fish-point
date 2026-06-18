'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchThisAreaButtonProps {
  /** Affiche le bouton uniquement quand une zone en attente diffère de la zone committée. */
  visible: boolean;
  onClick: () => void;
  /** Désactive le bouton pendant le chargement des nouveaux résultats. */
  isLoading?: boolean;
  className?: string;
}

/**
 * Bouton flottant « Rechercher dans cette zone ».
 *
 * Apparaît au-dessus de la carte après un pan/zoom : aucun re-fetch automatique,
 * l'utilisateur valide explicitement la nouvelle zone de recherche. Au clic, la
 * zone en attente devient la zone committée → carte ET liste se mettent à jour
 * ensemble, puis le bouton disparaît jusqu'au prochain déplacement.
 *
 * A11y : vrai `<button>` focusable, libellé explicite, masqué du tab order quand
 * absent (non rendu), désactivé pendant le chargement.
 */
export function SearchThisAreaButton({
  visible,
  onClick,
  isLoading = false,
  className,
}: SearchThisAreaButtonProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center sm:top-4">
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className={cn(
          'pointer-events-auto flex items-center gap-2 rounded-full border border-teal/30',
          'bg-abyss px-4 py-2 text-sm font-semibold text-white shadow-fs-md backdrop-blur',
          'transition-colors hover:bg-teal focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-teal focus-visible:ring-offset-2 disabled:opacity-70',
          className,
        )}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        {isLoading ? 'Recherche…' : 'Rechercher dans cette zone'}
      </button>
    </div>
  );
}
