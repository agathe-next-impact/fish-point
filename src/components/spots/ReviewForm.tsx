'use client';

import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Star } from 'lucide-react';
import { useNotificationStore } from '@/store/notification.store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { REVIEW_CRITERIA, CRITERION_LABELS, type ReviewCriterionKey } from '@/lib/review-aggregate';

interface ReviewFormProps {
  spotId: string;
  /** Appelé après création réussie d'un avis (pour rafraîchir la liste). */
  onSubmitted?: () => void;
}

/** Note globale 1–5 sous forme d'étoiles cliquables (jamais nulle, requise). */
function RatingStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Note globale (sur 5)"
      className="flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} sur 5`}
            onClick={() => onChange(n)}
            className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Star
              className={cn('h-7 w-7', active ? 'fill-yellow-500 text-yellow-500' : 'text-fs-muted')}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Un critère structuré : note 1–5 OPTIONNELLE (segmented control) + bouton
 * « Non noté » qui remet le critère à `null`. A11y : radiogroup labellisé,
 * chaque option a un libellé explicite.
 */
function CriterionInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (next: number | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
      <span id={`crit-${label}`} className="text-sm font-medium text-ink">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={`crit-${label}`} className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${label} : ${n} sur 5`}
            onClick={() => onChange(value === n ? null : n)}
            className={cn(
              'h-8 w-8 rounded-md border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              value === n
                ? 'border-primary bg-fs-accent text-white'
                : 'border-line text-fs-muted hover:border-primary hover:text-primary',
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`${label} : non noté`}
          aria-pressed={value === null}
          className={cn(
            'ml-1 rounded-md px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            value === null ? 'text-fs-muted' : 'text-faint hover:text-fs-muted',
          )}
        >
          Non noté
        </button>
      </div>
    </div>
  );
}

/** État local des 5 critères (tous nullable, défaut `null` = non renseigné). */
type CriteriaState = Record<ReviewCriterionKey, number | null>;

const EMPTY_CRITERIA: CriteriaState = {
  accessibility: null,
  fishDensity: null,
  cleanliness: null,
  tranquility: null,
  dataAccuracy: null,
};

/**
 * Formulaire d'avis structuré : note globale (requise) + 5 critères optionnels
 * (Accès · Poissons · Propreté · Fréquentation · Précision des données) +
 * commentaire. Réservé aux utilisateurs connectés (1 avis par spot — contrainte
 * `@@unique([userId, spotId])` côté DB).
 */
export function ReviewForm({ spotId, onSubmitted }: ReviewFormProps) {
  const { status } = useSession();
  const addToast = useNotificationStore((s) => s.addToast);

  const [rating, setRating] = useState(0);
  const [criteria, setCriteria] = useState<CriteriaState>(EMPTY_CRITERIA);
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);

  const setCriterion = useCallback((key: ReviewCriterionKey, next: number | null) => {
    setCriteria((prev) => ({ ...prev, [key]: next }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (rating < 1) {
        addToast({ type: 'error', title: 'Note requise', description: 'Donnez une note globale (1 à 5).' });
        return;
      }
      setPending(true);
      try {
        const res = await fetch(`/api/spots/${spotId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating,
            comment: comment.trim() ? comment.trim() : null,
            ...criteria,
          }),
        });
        if (!res.ok) throw new Error(`review POST failed: ${res.status}`);
        addToast({ type: 'success', title: 'Avis publié', description: 'Merci pour votre contribution.' });
        setRating(0);
        setCriteria(EMPTY_CRITERIA);
        setComment('');
        onSubmitted?.();
      } catch {
        addToast({
          type: 'error',
          title: 'Publication impossible',
          description: 'Vous avez peut-être déjà donné un avis. Réessayez plus tard.',
        });
      } finally {
        setPending(false);
      }
    },
    [rating, comment, criteria, spotId, addToast, onSubmitted],
  );

  if (status !== 'authenticated') {
    return (
      <p className="rounded-fs-lg border border-line p-4 text-sm text-fs-muted">
        Connectez-vous pour partager votre avis sur ce spot.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-fs-lg border border-line p-4">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-ink">Note globale</p>
        <RatingStars value={rating} onChange={setRating} />
      </div>

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-semibold text-ink">
          Notez par critère <span className="font-normal text-fs-muted">(facultatif)</span>
        </legend>
        {REVIEW_CRITERIA.map((key) => (
          <CriterionInput
            key={key}
            label={CRITERION_LABELS[key]}
            value={criteria[key]}
            onChange={(next) => setCriterion(key, next)}
          />
        ))}
      </fieldset>

      <div>
        <label htmlFor="review-comment" className="mb-1.5 block text-sm font-semibold text-ink">
          Commentaire <span className="font-normal text-fs-muted">(facultatif)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Accès, ambiance, ce qui mord…"
          className="w-full rounded-md border border-line bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <Button type="submit" isLoading={pending} disabled={pending}>
        Publier mon avis
      </Button>
    </form>
  );
}
