import { Calendar } from 'lucide-react';
import type { SpotSpeciesData } from '@/types/spot';

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function isInSpawnRange(month: number, start: number, end: number): boolean {
  if (end >= start) return month >= start && month <= end;
  return month >= start || month <= end;
}

interface SpotSpawnCalendarProps {
  species: SpotSpeciesData[];
}

export function SpotSpawnCalendar({ species }: SpotSpawnCalendarProps) {
  const speciesWithSpawn = species.filter(
    (s) => s.spawnMonthStart !== null && s.spawnMonthEnd !== null,
  );

  if (speciesWithSpawn.length === 0) return null;

  const currentMonth = new Date().getMonth() + 1;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Calendrier de frai
      </h2>
      <div className="rounded-lg border overflow-hidden">
        {/* Month headers */}
        <div className="grid grid-cols-[120px_repeat(12,1fr)] bg-muted/50 border-b">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Espèce</div>
          {MONTH_LABELS.map((label, i) => (
            <div
              key={i}
              className={`text-center py-1.5 text-xs font-medium ${
                i + 1 === currentMonth
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Species rows */}
        {speciesWithSpawn.map((s) => (
          <div key={s.id} className="grid grid-cols-[120px_repeat(12,1fr)] border-b last:border-b-0">
            <div className="px-2 py-1.5 text-xs font-medium truncate" title={s.name}>
              {s.name}
            </div>
            {MONTH_LABELS.map((_, i) => {
              const month = i + 1;
              const inSpawn = isInSpawnRange(month, s.spawnMonthStart!, s.spawnMonthEnd!);
              const isCurrent = month === currentMonth;
              return (
                <div
                  key={i}
                  className={`py-1.5 ${
                    inSpawn
                      ? 'bg-orange-200 dark:bg-orange-900/40'
                      : ''
                  } ${isCurrent ? 'ring-1 ring-inset ring-primary' : ''}`}
                />
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 px-3 py-2 bg-muted/30 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-orange-200 dark:bg-orange-900/40" />
            En frai
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm ring-1 ring-primary" />
            Mois actuel
          </span>
        </div>
      </div>
    </section>
  );
}
