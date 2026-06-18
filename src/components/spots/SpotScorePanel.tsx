'use client';

import { useState } from 'react';
import {
  Star,
  ShieldCheck,
  Info,
  ArrowUp,
  ArrowDown,
  Minus,
  Fish,
} from 'lucide-react';
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal';
import { ScoreBadge } from '@/components/ui/score-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFishabilityScore } from '@/hooks/useFishabilityScore';
import { computeReliability, type ReliabilityTier } from '@/lib/reliability';
import { cn } from '@/lib/utils';

interface SpotScorePanelProps {
  spotId: string;
  /** Indice de pêche global (0-100) déjà calculé côté serveur. */
  fishabilityScore: number | null;
  averageRating: number;
  reviewCount: number;
  /** Signaux réels de fiabilité dérivés du spot. */
  reliability: {
    accessConfidence: number | null;
    lastCheckedAt: string | null;
    scoreUpdatedAt: string | null;
    speciesCount: number;
    hasWaterQuality: boolean;
    hasObservations: boolean;
  };
}

/** Libellé honnête de l'indice de pêche (score GLOBAL du spot, non personnalisé). */
function fishIndexLabel(score: number): string {
  if (score >= 80) return 'Conditions excellentes';
  if (score >= 60) return 'Bonnes conditions';
  if (score >= 40) return 'Conditions moyennes';
  if (score >= 20) return 'Conditions difficiles';
  return 'Conditions défavorables';
}

const RELIABILITY_STYLES: Record<ReliabilityTier, { dot: string; text: string }> = {
  high: { dot: 'bg-score-hi', text: 'text-score-hi' },
  medium: { dot: 'bg-amber-deep', text: 'text-amber-deep' },
  low: { dot: 'bg-faint', text: 'text-fs-muted' },
};

const IMPACT_STYLES = {
  positive: { text: 'text-score-hi', Icon: ArrowUp, sr: 'favorable' },
  neutral: { text: 'text-fs-muted', Icon: Minus, sr: 'neutre' },
  negative: { text: 'text-amber-deep', Icon: ArrowDown, sr: 'défavorable' },
} as const;

export function SpotScorePanel({
  spotId,
  fishabilityScore,
  averageRating,
  reviewCount,
  reliability,
}: SpotScorePanelProps) {
  const [open, setOpen] = useState(false);
  const rel = computeReliability(reliability);
  const relStyle = RELIABILITY_STYLES[rel.tier];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* 1 — Indice de pêche (le « 78 ») */}
      <div className="flex flex-col gap-2 rounded-fs-md border border-line bg-card p-4 shadow-fs-sm">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fs-muted">
          <Fish className="h-3.5 w-3.5" aria-hidden />
          Indice de pêche
        </div>
        {fishabilityScore != null ? (
          <>
            <div className="flex items-center gap-3">
              <ScoreBadge score={fishabilityScore} size="md" />
              <div>
                <p className="text-sm font-semibold text-ink">{fishIndexLabel(fishabilityScore)}</p>
                <p className="text-xs text-fs-muted">Score global du spot, conditions actuelles</p>
              </div>
            </div>
            <Modal open={open} onOpenChange={setOpen}>
              <ModalTrigger asChild>
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-1 rounded-md text-xs font-semibold text-teal-deep underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Info className="h-3.5 w-3.5" aria-hidden />
                  Comment ce score est calculé
                </button>
              </ModalTrigger>
              {open && <ScoreDetailModal spotId={spotId} fishabilityScore={fishabilityScore} />}
            </Modal>
          </>
        ) : (
          <p className="text-sm text-fs-muted">Indice indisponible pour ce spot</p>
        )}
      </div>

      {/* 2 — Note communauté */}
      <div className="flex flex-col gap-2 rounded-fs-md border border-line bg-card p-4 shadow-fs-sm">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fs-muted">
          <Star className="h-3.5 w-3.5" aria-hidden />
          Note communauté
        </div>
        {reviewCount > 0 ? (
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 fill-amber text-amber" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">
                {averageRating.toFixed(1)}
                <span className="text-fs-muted"> / 5</span>
              </p>
              <p className="text-xs text-fs-muted">
                {reviewCount} avis de pêcheurs
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-fs-muted">Aucun avis pour l’instant</p>
        )}
      </div>

      {/* 3 — Fiabilité des données */}
      <div className="flex flex-col gap-2 rounded-fs-md border border-line bg-card p-4 shadow-fs-sm">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fs-muted">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Fiabilité des données
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', relStyle.dot)} aria-hidden />
          <p className={cn('text-sm font-semibold capitalize', relStyle.text)}>{rel.label}</p>
        </div>
        <ul className="space-y-0.5 text-xs text-fs-muted">
          {rel.reasons.slice(0, 2).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Détail consultable de l'indice de pêche — liste les VRAIS facteurs renvoyés
 * par la route de score (météo, eau, solunaire…). Aucun barème inventé.
 * Accessible : `Modal` (Radix Dialog) gère focus trap, Esc, et le couplage
 * ARIA title/description.
 */
function ScoreDetailModal({
  spotId,
  fishabilityScore,
}: {
  spotId: string;
  fishabilityScore: number;
}) {
  const { data, isLoading, isError } = useFishabilityScore(spotId);

  return (
    <ModalContent className="max-w-md rounded-fs-lg">
      <ModalHeader>
        <ModalTitle className="fs-dsp text-lg font-bold text-ink">
          Indice de pêche : {fishabilityScore}
        </ModalTitle>
        <ModalDescription className="text-sm text-fs-muted">
          Score global du spot (conditions actuelles et qualités du lieu). Il
          n’est pas encore adapté à votre sortie précise.
        </ModalDescription>
      </ModalHeader>

      {isLoading && (
        <div className="space-y-2" aria-live="polite">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-fs-muted">Détail du score momentanément indisponible.</p>
      )}

      {data && (
        <div className="space-y-4">
          {/* Composantes réelles : statique vs dynamique */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-fs-sm bg-paper p-3">
              <p className="text-xs text-fs-muted">Qualités du lieu (45 %)</p>
              <p className="text-lg font-bold text-ink">{data.staticScore}</p>
            </div>
            <div className="rounded-fs-sm bg-paper p-3">
              <p className="text-xs text-fs-muted">Conditions actuelles (55 %)</p>
              <p className="text-lg font-bold text-ink">{data.dynamicScore}</p>
            </div>
          </div>

          {/* Facteurs réellement renvoyés par l'API */}
          {data.factors && data.factors.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fs-muted">
                Facteurs pris en compte
              </p>
              <ul className="space-y-1.5">
                {data.factors.map((factor) => {
                  const style = IMPACT_STYLES[factor.impact];
                  const ImpactIcon = style.Icon;
                  return (
                    <li
                      key={`${factor.name}-${factor.description}`}
                      className="flex items-center justify-between gap-3 rounded-fs-sm border border-line-soft px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{factor.name}</p>
                        <p className="truncate text-xs text-fs-muted">{factor.description}</p>
                      </div>
                      <ImpactIcon
                        className={cn('h-4 w-4 shrink-0', style.text)}
                        aria-label={`Impact ${style.sr}`}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-fs-muted">
              Aucun facteur de conditions disponible pour le moment.
            </p>
          )}
        </div>
      )}
    </ModalContent>
  );
}
