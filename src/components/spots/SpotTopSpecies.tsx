import { Trophy } from 'lucide-react';
import { SpotSpeciesCard } from './SpotSpeciesCard';
import { isTrophySpecies, sortSpeciesByTrophy } from '@/lib/spot-catches';
import type { SpotSpeciesData } from '@/types/spot';

interface SpotTopSpeciesProps {
  species: SpotSpeciesData[];
}

/**
 * Section « Espèces mises en avant » : surface les espèces du spot de façon
 * décisionnelle — trophées d'abord (cf. `sortSpeciesByTrophy`), puis abondance.
 * Réutilise les données `species` déjà chargées dans la fiche (aucun fetch).
 * Présentationnel pur : si la liste est vide, rien n'est rendu (l'absence
 * d'espèce documentée est déjà couverte ailleurs par l'état « indisponible »).
 */
export function SpotTopSpecies({ species }: SpotTopSpeciesProps) {
  if (species.length === 0) return null;

  const sorted = sortSpeciesByTrophy(species);
  const hasTrophy = sorted.some((s) => isTrophySpecies(s.name));

  return (
    <section>
      <h2 className="fs-dsp text-lg font-bold text-ink mb-1 flex items-center gap-2">
        Espèces mises en avant
      </h2>
      {hasTrophy && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-fs-muted">
          <Trophy className="h-3.5 w-3.5 text-fs-accent" aria-hidden />
          Espèces trophées présentées en premier
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sorted.map((s) => (
          <SpotSpeciesCard key={s.id} species={s} />
        ))}
      </div>
    </section>
  );
}
