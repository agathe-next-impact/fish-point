import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRIP_VERDICT_LABEL, type TripVerdict } from '@/lib/trip-match';

/**
 * Styles du verdict « Adapté à votre sortie », alignés sur la fiche
 * (`SpotScorePanel.VERDICT_STYLES`) : même code couleur (vert/ambre/neutre) pour
 * une lecture cohérente entre liste, marqueur et fiche.
 */
const VERDICT_PILL: Record<TripVerdict, string> = {
  'tres-adapte': 'bg-[rgba(31,157,107,0.12)] text-score-hi',
  adapte: 'bg-[rgba(217,138,28,0.14)] text-amber-deep',
  'peu-adapte': 'bg-muted text-fs-muted',
};

interface VerdictBadgeProps {
  /** Verdict dérivé du même barème que la fiche (`computeTripMatch`). */
  verdict: TripVerdict;
  /** Score personnalisé 0-100 « Adapté à votre sortie ». */
  score: number;
  className?: string;
}

/**
 * Pastille compacte « Adapté à votre sortie » pour la liste et le marqueur :
 * permet de COMPARER les spots avant de cliquer quand une espèce est filtrée.
 *
 * Affichée UNIQUEMENT en contexte sortie (espèce ciblée) — l'appelant gate son
 * rendu. Le `%` est toujours montré (différenciateur entre spots) ; le libellé
 * court vient de `TRIP_VERDICT_LABEL` (source unique avec la fiche).
 *
 * A11y : le `span` porte un `aria-label` complet et explicite (« Très adapté à
 * votre sortie, 82 % ») ; l'icône décorative est masquée aux lecteurs d'écran.
 */
export function VerdictBadge({ verdict, score, className }: VerdictBadgeProps) {
  const label = TRIP_VERDICT_LABEL[verdict];
  return (
    <span
      aria-label={`${label}, ${score} %`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        VERDICT_PILL[verdict],
        className,
      )}
    >
      <Target className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} aria-hidden />
      <span aria-hidden>
        {verdict === 'tres-adapte' ? 'Très adapté' : 'Adapté'} {score}%
      </span>
    </span>
  );
}
