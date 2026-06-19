import Link from 'next/link';
import { FileQuestion, Plus } from 'lucide-react';

/**
 * États (forme react-query) servant à décider l'affichage d'un état « donnée
 * indisponible ». On ne dépend volontairement que de booléens dérivés pour
 * rester testable sans monter un QueryClient.
 */
export interface DataUnavailableGate {
  /** Requête en cours (1er chargement). react-query : `isLoading` / `isPending`. */
  isLoading: boolean;
  /** Requête en échec. react-query : `isError`. */
  isError: boolean;
  /** Requête réussie ET résultat sans données affichables. */
  isEmpty: boolean;
}

/**
 * Règle de gating PURE et testable.
 *
 * On n'affiche « donnée indisponible » QUE sur succès vide :
 * - `isLoading` → false (ne pas masquer un chargement légitime / skeleton) ;
 * - `isError` → false (ne pas masquer une panne : le message « indisponible »
 *   serait lu comme « pas de donnée » alors que la donnée n'a pas pu être lue) ;
 * - succès + vide → true (seul cas où l'absence est avérée) ;
 * - succès + données → false (rendu normal de la section).
 *
 * `isLoading` est prioritaire : tant qu'on charge, on ne sait pas si c'est vide.
 */
export function shouldShowDataUnavailable({
  isLoading,
  isError,
  isEmpty,
}: DataUnavailableGate): boolean {
  if (isLoading) return false;
  if (isError) return false;
  return isEmpty;
}

interface DataUnavailableProps {
  /** Slug du spot — cible du CTA « Ajouter une observation » (route existante). */
  spotSlug?: string;
  /** Libellé de la section (ex. « Qualité de l'eau ») affiché dans le titre. */
  sectionLabel: string;
}

/**
 * État explicite affiché à la place d'une section vide (cf. « sections vides
 * interdites »). Présentationnel : aucun fetch, aucune logique de gating ici —
 * l'appelant décide via {@link shouldShowDataUnavailable}.
 */
export function DataUnavailable({ spotSlug, sectionLabel }: DataUnavailableProps) {
  return (
    <section className="rounded-fs-lg border border-line p-4">
      <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-ink">
        <FileQuestion className="h-5 w-5 text-fs-muted" aria-hidden />
        {sectionLabel}
      </h2>
      <p className="text-sm text-fs-muted">
        <span className="font-semibold text-ink">Donnée indisponible</span> — aucune observation
        récente vérifiée.
      </p>
      {spotSlug && (
        <Link
          href={`/spots/${spotSlug}/edit`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-teal-deep transition-colors hover:border-fs-accent hover:text-fs-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden /> Ajouter une observation
        </Link>
      )}
    </section>
  );
}
