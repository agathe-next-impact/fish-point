'use client';

import { Star, User } from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  fishDensity: number | null;
  cleanliness: number | null;
  tranquility: number | null;
  accessibility: number | null;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

interface SpotReviewsProps {
  reviews: Review[];
}

export function SpotReviews({ reviews }: SpotReviewsProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucun avis pour le moment.</p>
        <p className="text-sm mt-1">Soyez le premier à donner votre avis !</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                {getInitials(review.user.name)}
              </div>
              <div>
                <p className="text-sm font-medium">{review.user.name || 'Anonyme'}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(review.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted',
                  )}
                />
              ))}
            </div>
          </div>
          {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
        </div>
      ))}
    </div>
  );
}
