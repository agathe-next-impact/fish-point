import { CatchCard } from './CatchCard';
import type { CatchData } from '@/types/catch';

interface CatchTimelineProps {
  catches: CatchData[];
}

export function CatchTimeline({ catches }: CatchTimelineProps) {
  if (catches.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Aucune prise enregistrée</p>
        <p className="text-sm mt-1">Commencez à logger vos prises pour remplir votre carnet !</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {catches.map((c) => (
        <CatchCard key={c.id} catchData={c} />
      ))}
    </div>
  );
}
