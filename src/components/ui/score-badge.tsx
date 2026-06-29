import { cn } from '@/lib/utils';
import { scoreColor, scoreBg } from '@/lib/score';

type ScoreSize = 'sm' | 'md' | 'lg';

const SIZES: Record<ScoreSize, { box: number; font: number; radius: number }> = {
  sm: { box: 38, font: 15, radius: 10 },
  md: { box: 46, font: 18, radius: 12 },
  lg: { box: 60, font: 24, radius: 14 },
};

interface ScoreBadgeProps {
  score: number;
  size?: ScoreSize;
  className?: string;
}

/**
 * Rounded-square fishability score badge (display font, two-tier colour rule).
 */
export function ScoreBadge({ score, size = 'md', className }: ScoreBadgeProps) {
  const s = SIZES[size];
  return (
    <span
      className={cn('fs-score', className)}
      style={{
        width: s.box,
        height: s.box,
        fontSize: s.font,
        borderRadius: s.radius,
        color: scoreColor(score),
        background: scoreBg(score),
      }}
    >
      {Math.round(score)}
    </span>
  );
}
