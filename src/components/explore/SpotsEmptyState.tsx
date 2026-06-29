'use client';

import Link from 'next/link';
import { Compass, Maximize2, RotateCcw, ArrowRight, Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SpotsEmptyStateProps {
  /** Une zone géographique est committée (la liste est bornée à la fenêtre carte). */
  isAreaRestricted: boolean;
  /** Au moins un filtre de la rail est actif. */
  hasActiveFilters: boolean;
  /** Un terme de recherche texte est saisi. */
  hasSearch: boolean;
  /**
   * Nombre de spots existant SANS le bornage géographique courant (même filtres,
   * sans bbox). `undefined` = comptage encore en cours / indisponible.
   */
  spotsElsewhere: number | undefined;
  /** Relâche `committedBounds` → liste nationale. */
  onWidenArea: () => void;
  /** Réinitialise la rail de filtres (zone conservée). */
  onClearFilters: () => void;
}

/**
 * État « 0 spot » de l'Explorer — jamais un cul-de-sac.
 *
 * Explique la cause probable (zone trop restreinte / filtres trop stricts / les
 * deux) et propose des actions du moins au plus destructif : élargir la zone,
 * relâcher les filtres, puis voir les spots existant ailleurs en France.
 *
 * A11y : région annoncée (`role="status"`, `aria-live="polite"`), vrais boutons
 * focusables avec libellés explicites.
 */
export function SpotsEmptyState({
  isAreaRestricted,
  hasActiveFilters,
  hasSearch,
  spotsElsewhere,
  onWidenArea,
  onClearFilters,
}: SpotsEmptyStateProps) {
  // Cause probable, formulée de façon encourageante (jamais culpabilisante).
  let reason: string;
  if (isAreaRestricted && (hasActiveFilters || hasSearch)) {
    reason =
      'La zone affichée est peut-être trop resserrée, et vos critères assez précis.';
  } else if (isAreaRestricted) {
    reason = 'La zone actuellement affichée sur la carte est peut-être trop resserrée.';
  } else if (hasActiveFilters || hasSearch) {
    reason = 'Vos critères de recherche sont peut-être un peu trop précis.';
  } else {
    reason = 'Aucun spot ne ressort pour l’instant — élargissez votre recherche.';
  }

  // Y a-t-il vraiment des spots ailleurs, hors de la fenêtre courante ?
  const elsewhereCount =
    isAreaRestricted && spotsElsewhere !== undefined && spotsElsewhere > 0
      ? spotsElsewhere
      : null;

  // Garde-fou anti-cul-de-sac : aucune action de relâchement possible (ni zone, ni
  // filtres, ni recherche) → on propose tout de même de contribuer un spot.
  const hasAnyAction = isAreaRestricted || hasActiveFilters || hasSearch;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex max-w-xl flex-col items-center rounded-fs-lg border border-line bg-card px-6 py-12 text-center shadow-fs-sm"
    >
      <span
        aria-hidden="true"
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-aqua-soft text-teal-deep"
      >
        <Compass className="h-7 w-7" />
      </span>

      <h2 className="fs-dsp text-xl font-bold text-ink">Aucun spot dans ces critères</h2>
      <p className="mt-2 text-sm text-fs-muted">{reason}</p>

      <div className="mt-7 flex w-full flex-col gap-2.5 sm:max-w-xs">
        {isAreaRestricted && (
          <Button variant="default" onClick={onWidenArea} className="w-full">
            <Maximize2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Élargir la zone à toute la France
          </Button>
        )}

        {(hasActiveFilters || hasSearch) && (
          <Button variant="outline" onClick={onClearFilters} className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Effacer les filtres
          </Button>
        )}

        {/* Aucune action de relâchement disponible : on ne laisse jamais l'écran sans issue. */}
        {!hasAnyAction && (
          <Link href="/spots/new" className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Proposer un spot
          </Link>
        )}
      </div>

      {elsewhereCount !== null && (
        <button
          type="button"
          onClick={onWidenArea}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-deep underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
        >
          Voir les {elsewhereCount} spot{elsewhereCount > 1 ? 's' : ''} ailleurs en France
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
