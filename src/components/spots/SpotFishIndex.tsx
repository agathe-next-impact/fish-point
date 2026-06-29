'use client';

import type { ReactNode } from 'react';
import {
  Fish,
  Wind,
  Droplets,
  Moon,
  Thermometer,
  Gauge,
  CloudRain,
  ArrowUp,
  ArrowDown,
  Minus,
  Sun,
  Layers,
  AlertTriangle,
  TrendingDown,
  CloudDrizzle,
  Waves,
  Flower2,
  CalendarClock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFishabilityScore } from '@/hooks/useFishabilityScore';
import {
  DataUnavailable,
  shouldShowDataUnavailable,
} from './DataUnavailable';
import {
  summarizeDayConditions,
  sortConditionsForDisplay,
  DAY_VERDICT_LABEL,
  type ConditionImpact,
  type DayConditionFactor,
} from '@/lib/day-conditions';
import { cn } from '@/lib/utils';

interface SpotFishIndexProps {
  spotId: string;
  /** Slug du spot — cible du CTA « Ajouter une observation » sur l'état vide. */
  spotSlug?: string;
}

const FACTOR_ICONS: Record<string, typeof Fish> = {
  'Écoulement': Droplets,
  'Vigilance crues': CloudRain,
  'Sécheresse': AlertTriangle,
  'Pression': Gauge,
  'Tendance baro': TrendingDown,
  'Vent': Wind,
  'UV': Sun,
  'Précipitations': CloudDrizzle,
  'Solunaire': Moon,
  'Lune': Moon,
  'Nappe': Layers,
  'Temp. eau': Thermometer,
  'Prévision crues': Waves,
  'Pollen': Flower2,
};

const IMPACT_STYLES: Record<
  ConditionImpact,
  { row: string; icon: string; Icon: typeof ArrowUp; sr: string }
> = {
  positive: {
    row: 'border-line-soft',
    icon: 'text-score-hi',
    Icon: ArrowUp,
    sr: 'favorable',
  },
  neutral: {
    row: 'border-line-soft',
    icon: 'text-fs-muted',
    Icon: Minus,
    sr: 'neutre',
  },
  negative: {
    row: 'border-amber-deep',
    icon: 'text-amber-deep',
    Icon: ArrowDown,
    sr: 'défavorable',
  },
};

const VERDICT_DOT: Record<string, string> = {
  favorable: 'bg-score-hi',
  mitige: 'bg-amber-deep',
  defavorable: 'bg-amber-deep',
  inconnu: 'bg-faint',
};

function CardShell({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarClock className="h-4 w-4" aria-hidden />
          Conditions du jour
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/**
 * Carte « Conditions du jour » — lecture pêche des conditions live réelles le
 * jour de la sortie.
 *
 * Reconvertie depuis l'ancienne « Activité piscicole » : on N'AFFICHE PLUS le
 * score global (le « 78 ») ni le jargon statique/dynamique — ils vivent
 * désormais dans `SpotScorePanel` (en-tête). Ici on ne montre que les
 * `factors[]` dynamiques réellement renvoyés par `/api/spots/[id]/score`
 * (météo, eau, solunaire, crues…), regroupés par impact favorable / à
 * surveiller. Aucune valeur n'est inventée.
 */
export function SpotFishIndex({ spotId, spotSlug }: SpotFishIndexProps) {
  const { data, isLoading, isError } = useFishabilityScore(spotId);

  if (isLoading) {
    return (
      <CardShell>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </CardShell>
    );
  }

  // Panne réelle : ne pas la maquiller en « donnée indisponible ».
  if (isError) {
    return (
      <CardShell>
        <p className="text-sm text-fs-muted">Conditions momentanément indisponibles.</p>
      </CardShell>
    );
  }

  const factors: DayConditionFactor[] = data?.factors ?? [];
  const isEmpty = factors.length === 0;

  // Succès mais aucun signal réel → état explicite (cf. sections vides interdites).
  if (shouldShowDataUnavailable({ isLoading, isError, isEmpty })) {
    return <DataUnavailable spotSlug={spotSlug} sectionLabel="Conditions du jour" />;
  }

  const { counts, verdict } = summarizeDayConditions(factors);
  const sorted = sortConditionsForDisplay(factors);

  return (
    <CardShell>
      <div className="space-y-3">
        {/* Verdict synthétique — d'un coup d'œil, sans score chiffré */}
        <div className="flex items-center gap-2">
          <span
            className={cn('h-2.5 w-2.5 shrink-0 rounded-full', VERDICT_DOT[verdict])}
            aria-hidden
          />
          <p className="text-sm font-semibold text-ink">{DAY_VERDICT_LABEL[verdict]}</p>
        </div>

        {/* Comptage réel des signaux */}
        <p className="text-xs text-fs-muted">
          {counts.positive > 0 && (
            <span className="text-score-hi">{counts.positive} favorable{counts.positive > 1 ? 's' : ''}</span>
          )}
          {counts.positive > 0 && counts.negative > 0 && <span> · </span>}
          {counts.negative > 0 && (
            <span className="text-amber-deep">{counts.negative} à surveiller</span>
          )}
          {(counts.positive > 0 || counts.negative > 0) && counts.neutral > 0 && <span> · </span>}
          {counts.neutral > 0 && <span>{counts.neutral} neutre{counts.neutral > 1 ? 's' : ''}</span>}
          <span> sur {counts.total} condition{counts.total > 1 ? 's' : ''} relevée{counts.total > 1 ? 's' : ''}</span>
        </p>

        {/* Conditions actuelles, défavorables remontées en premier */}
        <ul className="space-y-1 border-t border-line pt-2">
          {sorted.map((factor) => {
            const FactorIcon = FACTOR_ICONS[factor.name] ?? Fish;
            const style = IMPACT_STYLES[factor.impact];
            const ImpactIcon = style.Icon;
            return (
              <li
                key={`${factor.name}-${factor.description}`}
                className={cn('flex items-center gap-2 rounded-fs-sm border px-2 py-1.5', style.row)}
              >
                <FactorIcon className={cn('h-3.5 w-3.5 shrink-0', style.icon)} aria-hidden />
                <span className="flex-1 truncate text-xs font-medium text-ink">{factor.name}</span>
                <span className="max-w-[10rem] truncate text-[11px] text-fs-muted">
                  {factor.description}
                </span>
                <ImpactIcon
                  className={cn('h-3.5 w-3.5 shrink-0', style.icon)}
                  aria-label={`Impact ${style.sr}`}
                />
              </li>
            );
          })}
        </ul>

        <p className="text-[11px] text-faint">
          Conditions actuelles, pas un score. L’indice de pêche est en haut de la fiche.
        </p>
      </div>
    </CardShell>
  );
}
