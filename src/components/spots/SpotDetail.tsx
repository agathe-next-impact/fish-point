'use client';

import { MapPin, Check, Heart, Navigation, Eye, Database, Accessibility, ParkingCircle, Ship, Moon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AccessTag } from '@/components/ui/access-tag';
import { SpotScorePanel } from './SpotScorePanel';
import { WATER_TYPE_LABELS, FISHING_TYPE_LABELS } from '@/lib/constants';
import { getDepartmentName } from '@/config/departments';
import { formatDate } from '@/lib/utils';
import { SpotRegulations } from './SpotRegulations';
import { SpotWeather } from './SpotWeather';
import { SpotWaterLevel } from './SpotWaterLevel';
import { SpotFishIndex } from './SpotFishIndex';
import { SpotShareButton } from './SpotShareButton';
import { SpotAlerts } from './SpotAlerts';
import { SpotSpeciesCard } from './SpotSpeciesCard';
import { SpotWaterQuality } from './SpotWaterQuality';
import { SpotSpawnCalendar } from './SpotSpawnCalendar';
import { SpotObservations } from './SpotObservations';
import { SpotBiodiversity } from './SpotBiodiversity';
import { SpotSolunar } from './SpotSolunar';
import { SpotDroughtBanner } from './SpotDroughtBanner';
import { SpotProtectedZones } from './SpotProtectedZones';
import { SpotGallery } from './SpotGallery';
import type { SpotDetail as SpotDetailType } from '@/types/spot';

interface ReliabilitySignals {
  accessConfidence: number | null;
  lastCheckedAt: string | null;
  scoreUpdatedAt: string | null;
  speciesCount: number;
  hasWaterQuality: boolean;
  hasObservations: boolean;
}

interface SpotDetailProps {
  spot: SpotDetailType;
  reliability: ReliabilitySignals;
}

export function SpotDetail({ spot, reliability }: SpotDetailProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Drought restriction banner (go/no-go) */}
      <SpotDroughtBanner spotId={spot.id} />

      {/* Image gallery (DB images + IGN/Wikimedia/Unsplash) */}
      <div className="mb-6">
        <SpotGallery images={spot.images} spotName={spot.name} spotId={spot.id} />
      </div>

      {/* Title section */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="fs-dsp text-2xl font-extrabold text-ink sm:text-3xl">{spot.name}</h1>
            {spot.isVerified && <Check className="h-5 w-5 text-fs-accent" aria-label="Spot vérifié" />}
          </div>
          <div className="mt-1 flex items-center gap-2 text-fs-muted">
            <MapPin className="h-4 w-4" strokeWidth={1.9} aria-hidden />
            <span>{spot.commune ? `${spot.commune}, ` : ''}{getDepartmentName(spot.department)} ({spot.department})</span>
          </div>
          <div className="mt-2">
            <AccessTag accessType={spot.accessType} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Heart className="h-4 w-4" /> Enregistrer
          </Button>
          <SpotShareButton spotName={spot.name} spotSlug={spot.slug} />
        </div>
      </div>

      {/* Trois indicateurs distincts : indice de pêche · note communauté · fiabilité */}
      <div className="mb-3">
        <SpotScorePanel
          spotId={spot.id}
          fishabilityScore={spot.fishabilityScore}
          averageRating={spot.averageRating}
          reviewCount={spot.reviewCount}
          reliability={reliability}
        />
      </div>

      {/* Vues = popularité de page, pas un indicateur de qualité → rétrogradé */}
      <p className="mb-6 flex items-center gap-1 text-xs text-faint">
        <Eye className="h-3 w-3" aria-hidden /> {spot.viewCount} vues — popularité de la page
      </p>

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 space-y-6">
          {spot.description && (
            <section>
              <h2 className="fs-dsp text-lg font-bold text-ink mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-line">{spot.description}</p>
            </section>
          )}

          <section>
            <h2 className="fs-dsp text-lg font-bold text-ink mb-3">Informations</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type d&apos;eau</p>
                <p className="font-medium">{WATER_TYPE_LABELS[spot.waterType]}</p>
              </div>
              {spot.waterCategory && (
                <div>
                  <p className="text-sm text-muted-foreground">Catégorie</p>
                  <p className="font-medium">{spot.waterCategory === 'FIRST' ? '1ère catégorie' : '2ème catégorie'}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Accès</p>
                <div className="mt-1">
                  <AccessTag accessType={spot.accessType} />
                </div>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-muted-foreground mb-2">Techniques de pêche</p>
              <div className="flex flex-wrap gap-1">
                {spot.fishingTypes.map((t) => (
                  <Badge key={t} variant="secondary">{FISHING_TYPE_LABELS[t] || t}</Badge>
                ))}
              </div>
            </div>
          </section>

          {spot.accessibility && (
            <section>
              <h2 className="fs-dsp text-lg font-bold text-ink mb-3">Accès & équipements</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'pmr' as const, label: 'PMR', Icon: Accessibility },
                  { key: 'parking' as const, label: 'Parking', Icon: ParkingCircle },
                  { key: 'boatLaunch' as const, label: 'Mise à l\u2019eau', Icon: Ship },
                  { key: 'nightFishing' as const, label: 'Pêche de nuit', Icon: Moon },
                ].map(({ key, label, Icon }) => {
                  const available = spot.accessibility![key];
                  return (
                    <div
                      key={key}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center ${
                        available
                          ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800'
                          : 'opacity-40'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${available ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {spot.species.length > 0 && (
            <section>
              <h2 className="fs-dsp text-lg font-bold text-ink mb-3">Espèces présentes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {spot.species.map((s) => (
                  <SpotSpeciesCard key={s.id} species={s} />
                ))}
              </div>
            </section>
          )}

          <SpotSpawnCalendar species={spot.species} />

          <SpotWaterQuality spotId={spot.id} />

          <SpotObservations spotId={spot.id} />

          <SpotBiodiversity spotId={spot.id} />

          <SpotProtectedZones spotId={spot.id} />

          <SpotRegulations regulations={spot.regulations} />
        </div>

        <div className="space-y-4">
          <SpotAlerts spotId={spot.id} />
          <SpotWeather spotId={spot.id} />
          <SpotWaterLevel spotId={spot.id} />
          <SpotFishIndex spotId={spot.id} />
          <SpotSolunar spotId={spot.id} />

          <div className="rounded-fs-lg border border-line p-4">
            <h3 className="mb-2 text-sm font-bold text-ink">Coordonnées</h3>
            <p className="font-mono text-sm text-fs-muted">
              {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fs-btn fs-btn-primary mt-3 w-full"
            >
              <Navigation className="h-4 w-4" /> Itinéraire
            </a>
          </div>

          {spot.dataOrigin !== 'USER' ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Database className="h-3.5 w-3.5" />
              <span>Source : données gouvernementales (OFB)</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Ajouté le {formatDate(spot.createdAt)} par {spot.author?.name || 'Anonyme'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
