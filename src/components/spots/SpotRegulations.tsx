import Link from 'next/link';
import { AlertTriangle, ExternalLink, FileQuestion, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { REGULATION_TYPE_LABELS } from '@/lib/constants';
import { formatRegulationPeriod } from '@/services/regulations.service';
import type { SpotRegulationData } from '@/types/spot';

interface SpotRegulationsProps {
  regulations: SpotRegulationData[];
  /** Slug du spot — cible du CTA « Ajouter une observation ». */
  spotSlug?: string;
}

export function SpotRegulations({ regulations, spotSlug }: SpotRegulationsProps) {
  // Données réellement absentes (props, pas de fetch → jamais un état de chargement).
  // On NE dit JAMAIS « aucune restriction connue » : lu à tort comme une autorisation.
  // Cf. confiance réglementaire — on affiche un état explicite « donnée indisponible ».
  if (regulations.length === 0) {
    return (
      <section className="rounded-fs-lg border border-line p-4">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-ink">
          <FileQuestion className="h-5 w-5 text-fs-muted" aria-hidden />
          Réglementation
        </h2>
        <p className="text-sm text-fs-muted">
          <span className="font-semibold text-ink">Donnée indisponible</span> — aucune observation récente
          vérifiée. Consultez la source officielle (préfecture / AAPPMA) avant votre sortie.
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

  const hasAlert = regulations.some(
    (r) => r.isActive && ['POLLUTION_ALERT', 'DROUGHT_ALERT', 'FLOOD_ALERT', 'PERMANENT_BAN'].includes(r.type),
  );

  return (
    <section className={`rounded-lg border p-4 ${hasAlert ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : ''}`}>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        {hasAlert ? (
          <AlertTriangle className="h-5 w-5 text-red-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        )}
        Réglementation
      </h2>
      <div className="space-y-3">
        {regulations.map((reg) => (
          <div key={reg.id} className="flex items-start gap-3">
            <Badge
              variant={reg.isActive ? (hasAlert ? 'danger' : 'warning') : 'secondary'}
              className="mt-0.5 shrink-0 text-[10px]"
            >
              {reg.isActive ? 'Actif' : 'Inactif'}
            </Badge>
            <div className="flex-1">
              <p className="text-sm font-medium">{REGULATION_TYPE_LABELS[reg.type] || reg.type}</p>
              <p className="text-xs text-muted-foreground">{reg.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatRegulationPeriod(reg.startDate, reg.endDate)}
              </p>
              {reg.source && (
                <a
                  href={reg.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  Source officielle <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
