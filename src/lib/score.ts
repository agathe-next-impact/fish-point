/**
 * FishSpot score → colour rule (design handoff).
 * Single source of truth for fishability score colours, used by
 * ScoreBadge, SpotCard and the map GL layers so they always agree.
 *
 *   score >= 80  → green  #1f9d6b  (bg rgba(31,157,107,0.12))
 *   score <  80  → amber  #d98a1c  (bg rgba(217,138,28,0.14))
 */

export const SCORE_HI = '#1f9d6b';
export const SCORE_MID = '#d98a1c';

/** Foreground/fill colour for a fishability score. */
export function scoreColor(score: number): string {
  return score >= 80 ? SCORE_HI : SCORE_MID;
}

/** Soft background tint for a score badge. */
export function scoreBg(score: number): string {
  return score >= 80 ? 'rgba(31,157,107,0.12)' : 'rgba(217,138,28,0.14)';
}
