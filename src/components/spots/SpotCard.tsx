import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Navigation, Star } from 'lucide-react';
import { ScoreBadge } from '@/components/ui/score-badge';
import { AccessTag } from '@/components/ui/access-tag';
import { SaveSpotButton } from '@/components/spots/SaveSpotButton';
import { WATER_TYPE_LABELS, WATER_CATEGORY_LABELS, FISHING_TYPE_LABELS } from '@/lib/constants';
import { getDepartmentName } from '@/config/departments';
import { formatDistance } from '@/lib/map';
import { buildDirectionsUrl } from '@/lib/directions';
import { formatSpotName } from '@/lib/spot-name';
import { getOrthoPhotoUrl } from '@/services/ign-ortho.service';
import type { SpotListItem } from '@/types/spot';

interface SpotCardProps {
  spot: SpotListItem;
}

export const SpotCard = memo(function SpotCard({ spot }: SpotCardProps) {
  const displayName = formatSpotName({ name: spot.name, commune: spot.commune, waterType: spot.waterType });
  const imageUrl = spot.primaryImage || getOrthoPhotoUrl(spot.latitude, spot.longitude, 600, 400);
  const secondaryChip =
    (spot.waterCategory && WATER_CATEGORY_LABELS[spot.waterCategory]) ||
    (spot.fishingTypes?.[0] && FISHING_TYPE_LABELS[spot.fishingTypes[0]]) ||
    null;

  return (
    <article className="group relative overflow-hidden rounded-fs-lg border border-line bg-card shadow-fs-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-fs-md focus-within:-translate-y-1 focus-within:shadow-fs-md">
      {/*
        Lien « voir la fiche » en overlay (stretched-link) : il couvre toute la zone contenu
        (média + texte) au clic et au clavier SANS envelopper la barre d'actions.
        → aucune ancre imbriquée (l'<a> Itinéraire reste hors de ce <a>), et un clic sur
        Enregistrer/Itinéraire ne navigue pas (les actions sont en relative z-10 au-dessus).
      */}
      <Link
        href={`/spots/${spot.slug}`}
        aria-label={`Voir la fiche : ${displayName}`}
        className="block rounded-fs-lg after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative h-[140px] bg-muted">
          <Image
            src={imageUrl}
            alt={displayName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
          {spot.fishabilityScore != null && (
            <div className="absolute right-2.5 top-2.5">
              <ScoreBadge score={spot.fishabilityScore} size="sm" className="shadow-fs-sm" />
            </div>
          )}
          {spot.isPremium && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold text-white shadow-fs-sm">
              Premium
            </span>
          )}
          <div className="absolute bottom-2.5 left-2.5">
            <AccessTag accessType={spot.accessType} variant="dark" />
          </div>
        </div>

        <div className="p-4">
          <h3 className="fs-dsp truncate text-[17px] font-bold text-ink">{displayName}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-fs-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
            <span className="truncate">
              {spot.commune ? `${spot.commune}, ` : ''}
              {getDepartmentName(spot.department)}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate rounded-full bg-aqua-soft px-2.5 py-1 text-xs font-semibold text-teal-deep">
                {WATER_TYPE_LABELS[spot.waterType] || spot.waterType}
              </span>
              {secondaryChip && (
                <span className="truncate rounded-full px-2.5 py-1 text-xs font-semibold text-fs-muted shadow-[inset_0_0_0_1.5px_var(--fs-line)]">
                  {secondaryChip}
                </span>
              )}
            </div>
            {spot.distance !== undefined ? (
              <span className="flex shrink-0 items-center gap-0.5 text-xs text-fs-muted">
                <Navigation className="h-3 w-3" strokeWidth={1.9} />
                {formatDistance(spot.distance)}
              </span>
            ) : spot.averageRating > 0 ? (
              <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-ink">
                <Star className="h-3.5 w-3.5 fill-amber text-amber" />
                {spot.averageRating.toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/*
        Barre d'actions — HORS du <Link> ci-dessus (frère/sœur dans l'<article>).
        relative z-10 → au-dessus de l'overlay stretched-link : un clic ici n'ouvre pas la
        fiche. « Enregistrer » et « Itinéraire » sont donc accessibles depuis la liste sans
        ouvrir la fiche, et l'<a> Itinéraire n'est jamais imbriqué dans l'<a> de la fiche.
      */}
      <div className="relative z-10 flex items-center gap-2 px-4 pb-4">
        <SaveSpotButton
          variant="compact"
          spot={{
            id: spot.id,
            slug: spot.slug,
            name: spot.name,
            latitude: spot.latitude,
            longitude: spot.longitude,
          }}
        />
        <a
          href={buildDirectionsUrl(spot.latitude, spot.longitude)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Itinéraire vers ${displayName}`}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Navigation className="h-4 w-4" strokeWidth={1.9} aria-hidden /> Itinéraire
        </a>
      </div>
    </article>
  );
});
