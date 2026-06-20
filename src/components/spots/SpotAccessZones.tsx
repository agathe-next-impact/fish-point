import Link from 'next/link';
import { MapPin, Navigation } from 'lucide-react';
import { AccessTag } from '@/components/ui/access-tag';
import { buildDirectionsUrl } from '@/lib/directions';
import type { SpotAccessZoneSummary } from '@/types/spot';

interface SpotAccessZonesProps {
  /** Zones d'accès public rattachées à ce plan d'eau (relation enfant `kind=ACCESS_ZONE`). */
  accessZones: SpotAccessZoneSummary[];
}

/**
 * Bloc « Accès publics » de la fiche d'un plan d'eau (modèle 3 niveaux) : liste les zones
 * d'accès rattachées (rive, mise à l'eau, parking…). Ne s'affiche que s'il en existe —
 * sinon `null` (aucun encombrement tant que la donnée niveau 2 n'existe pas).
 */
export function SpotAccessZones({ accessZones }: SpotAccessZonesProps) {
  if (accessZones.length === 0) return null;

  return (
    <section>
      <h2 className="fs-dsp text-lg font-bold text-ink mb-3">
        Accès publics ({accessZones.length})
      </h2>
      <ul className="space-y-2">
        {accessZones.map((zone) => (
          <li
            key={zone.id}
            className="flex items-center justify-between gap-3 rounded-fs-lg border border-line p-3"
          >
            <Link
              href={`/spots/${zone.slug}`}
              className="flex min-w-0 items-center gap-2 font-medium text-ink hover:text-primary"
            >
              <MapPin className="h-4 w-4 shrink-0 text-fs-muted" aria-hidden />
              <span className="truncate">{zone.name}</span>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <AccessTag accessType={zone.accessType} />
              <a
                href={buildDirectionsUrl(zone.latitude, zone.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Itinéraire vers ${zone.name}`}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-input bg-background px-2 text-xs font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Navigation className="h-3.5 w-3.5" aria-hidden /> Itinéraire
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
