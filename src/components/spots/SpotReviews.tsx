'use client';

import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Star } from 'lucide-react';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  aggregateReviewCriteria,
  formatCriterionAverage,
  REVIEW_CRITERIA,
  CRITERION_LABELS,
  type ReviewCriterionKey,
} from '@/lib/review-aggregate';
import { DataUnavailable, shouldShowDataUnavailable } from './DataUnavailable';
import { ReviewForm } from './ReviewForm';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  accessibility: number | null;
  fishDensity: number | null;
  cleanliness: number | null;
  tranquility: number | null;
  dataAccuracy: number | null;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

async function fetchReviews(spotId: string): Promise<Review[]> {
  const res = await fetch(`/api/spots/${spotId}/reviews`);
  // Throw sur échec HTTP : react-query expose `isError`, ce qui distingue une
  // panne d'un succès vide (cf. `shouldShowDataUnavailable`).
  if (!res.ok) throw new Error(`reviews fetch failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}

interface SpotReviewsProps {
  spotId: string;
  /** Slug du spot — cible du CTA quand la section est vide. */
  spotSlug?: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('h-4 w-4', i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-fs-muted')}
          aria-hidden
        />
      ))}
    </div>
  );
}

/** Petit pavé « Critère · moyenne · nb d'avis » de la synthèse agrégée. */
function CriterionAverageTile({
  label,
  average,
  count,
}: {
  label: string;
  average: number | null;
  count: number;
}) {
  return (
    <div className="rounded-md border border-line p-2.5 text-center">
      <p className="text-xs text-fs-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-ink">{formatCriterionAverage(average)}</p>
      <p className="text-[11px] text-faint">
        {count > 0 ? `${count} avis` : 'non noté'}
      </p>
    </div>
  );
}

export function SpotReviews({ spotId, spotSlug }: SpotReviewsProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['spotReviews', spotId],
    queryFn: () => fetchReviews(spotId),
    staleTime: 300_000, // 5 min
  });

  const reviews = data ?? [];
  const isEmpty = reviews.length === 0;
  const averages = aggregateReviewCriteria(reviews);

  return (
    <section aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="fs-dsp mb-3 flex items-center gap-2 text-lg font-bold text-ink">
        <MessageSquare className="h-5 w-5" aria-hidden />
        Avis structurés
      </h2>

      {/* Formulaire de contribution (toujours visible aux connectés). */}
      <div className="mb-5">
        <ReviewForm spotId={spotId} onSubmitted={() => void refetch()} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : shouldShowDataUnavailable({ isLoading, isError, isEmpty }) ? (
        <DataUnavailable spotSlug={spotSlug} sectionLabel="Avis structurés" />
      ) : isError ? (
        // Panne de lecture : ne pas la maquiller en « pas d'avis ».
        <p className="text-sm text-fs-muted">Avis momentanément indisponibles.</p>
      ) : (
        <div className="space-y-5">
          {/* Synthèse : moyennes par critère, calculées sur les avis du spot. */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {averages.map((c) => (
              <CriterionAverageTile key={c.key} label={c.label} average={c.average} count={c.count} />
            ))}
          </div>

          {/* Liste des avis individuels avec leurs critères. */}
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-fs-lg border border-line p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {getInitials(review.user.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{review.user.name || 'Anonyme'}</p>
                      <p className="text-xs text-fs-muted">{formatRelativeTime(review.createdAt)}</p>
                    </div>
                  </div>
                  <StarRow rating={review.rating} />
                </div>

                {review.comment && (
                  <p className="mb-2 text-sm text-muted-foreground">{review.comment}</p>
                )}

                {/* Critères renseignés par cet avis (on omet les non notés). */}
                <ReviewCriteriaTags review={review} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Affiche les critères structurés notés par UN avis (ignore les `null`). */
function ReviewCriteriaTags({ review }: { review: Review }) {
  const tags = REVIEW_CRITERIA.map((key) => ({ key, value: review[key as ReviewCriterionKey] })).filter(
    (t): t is { key: ReviewCriterionKey; value: number } => typeof t.value === 'number',
  );
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map(({ key, value }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-xs text-fs-muted"
        >
          {CRITERION_LABELS[key]}
          <span className="font-semibold text-ink">{value}/5</span>
        </span>
      ))}
    </div>
  );
}
