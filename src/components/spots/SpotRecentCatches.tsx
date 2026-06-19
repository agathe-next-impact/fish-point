'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Fish, Trophy, Ruler, Weight, Plus, FileQuestion } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FISH_CATEGORY_LABELS } from '@/lib/constants';
import { shouldShowDataUnavailable } from './DataUnavailable';
import type { RecentCatchesBySpecies } from '@/lib/spot-catches';

async function fetchRecentCatches(spotId: string): Promise<RecentCatchesBySpecies[]> {
  const res = await fetch(`/api/spots/${spotId}/catches`);
  // Throw sur échec HTTP : react-query expose `isError`, ce qui permet de
  // distinguer une panne d'un succès vide (sinon « aucune prise » masquerait
  // une erreur serveur).
  if (!res.ok) throw new Error(`recent-catches fetch failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}

function formatLastCaught(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Formate une fourchette de mesures (poids/taille) : « 2 » ou « 2–5 », ou null si aucune. */
function formatRange(min: number | null, max: number | null): string | null {
  if (min === null || max === null) return null;
  if (min === max) return `${round1(min)}`;
  return `${round1(min)}–${round1(max)}`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

interface SpotRecentCatchesProps {
  spotId: string;
}

/**
 * Section fiche « Prises récentes par espèce » : agrégat des prises PUBLIQUES du
 * spot, groupées par espèce, triées par récence puis fréquence. Espèces trophées
 * mises en valeur. Sur succès vide → état explicite + CTA « Enregistrer une prise ».
 */
export function SpotRecentCatches({ spotId }: SpotRecentCatchesProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['spotRecentCatches', spotId],
    queryFn: () => fetchRecentCatches(spotId),
    staleTime: 600_000,
  });

  if (isLoading) {
    return (
      <section>
        <h2 className="fs-dsp text-lg font-bold text-ink mb-3 flex items-center gap-2">
          <Fish className="h-5 w-5" aria-hidden />
          Prises récentes par espèce
        </h2>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </section>
    );
  }

  const species = data ?? [];
  const isEmpty = species.length === 0;

  if (isEmpty) {
    // `isLoading` est déjà traité (skeleton). Ici : succès vide → message explicite
    // + CTA. Erreur → on ne masque pas la panne (return null), conformément au gate.
    if (!shouldShowDataUnavailable({ isLoading, isError, isEmpty })) return null;
    return (
      <section className="rounded-fs-lg border border-line p-4">
        <h2 className="fs-dsp text-lg font-bold text-ink mb-2 flex items-center gap-2">
          <FileQuestion className="h-5 w-5 text-fs-muted" aria-hidden />
          Prises récentes par espèce
        </h2>
        <p className="text-sm text-fs-muted">
          <span className="font-semibold text-ink">Aucune prise récente vérifiée</span> sur ce spot.
          Soyez le premier à partager la vôtre.
        </p>
        <Link
          href="/catches/new"
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-teal-deep transition-colors hover:border-fs-accent hover:text-fs-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden /> Enregistrer une prise
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h2 className="fs-dsp text-lg font-bold text-ink mb-3 flex items-center gap-2">
        <Fish className="h-5 w-5" aria-hidden />
        Prises récentes par espèce
      </h2>
      <ul className="space-y-2">
        {species.map((s) => {
          const weightRange = formatRange(s.minWeight, s.maxWeight);
          const lengthRange = formatRange(s.minLength, s.maxLength);
          return (
            <li
              key={s.speciesId}
              className="flex items-start justify-between gap-3 rounded-lg border border-line p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {s.isTrophy && (
                    <Trophy className="h-3.5 w-3.5 shrink-0 text-fs-accent" aria-label="Espèce trophée" />
                  )}
                  <p className="truncate font-semibold text-sm text-ink">{s.speciesName}</p>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {FISH_CATEGORY_LABELS[s.category] || s.category}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-fs-muted">
                  Dernière prise le {formatLastCaught(s.lastCaughtAt)}
                </p>
                {(weightRange || lengthRange) && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-fs-muted">
                    {lengthRange && (
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="h-3 w-3 shrink-0" aria-hidden /> {lengthRange} cm
                      </span>
                    )}
                    {weightRange && (
                      <span className="inline-flex items-center gap-1">
                        <Weight className="h-3 w-3 shrink-0" aria-hidden /> {weightRange} kg
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {s.count} prise{s.count > 1 ? 's' : ''}
              </Badge>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
