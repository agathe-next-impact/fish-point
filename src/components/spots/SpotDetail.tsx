'use client';

import { Star, MapPin, Check, Share2, Heart, Navigation, Eye, Database, Accessibility, ParkingCircle, Ship, Moon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WATER_TYPE_LABELS, FISHING_TYPE_LABELS, ABUNDANCE_LABELS } from '@/lib/constants';
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
import type { SpotDetail as SpotDetailType } from '@/types/spot';

interface SpotDetailProps {
  spot: SpotDetailType;
}

export function SpotDetail({ spot }: SpotDetailProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Drought restriction banner (go/no-go) */}
      <SpotDroughtBanner spotId={spot.id} />

      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">{spot.name}</h1>
            {spot.isVerified && <Check className="h-5 w-5 text-green-500" />}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{spot.commune ? `${spot.commune}, ` : ''}Département {spot.department}</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            {spot.averageRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{spot.averageRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({spot.reviewCount} avis)</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> {spot.viewCount} vues
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Heart className="h-4 w-4 mr-1" /> Favoris
          </Button>
          <SpotShareButton spotName={spot.name} spotSlug={spot.slug} />
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 space-y-6">
          {spot.description && (
            <section>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-line">{spot.description}</p>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold mb-3">Informations</h2>
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
              <h2 className="text-lg font-semibold mb-3">Accès & équipements</h2>
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
              <h2 className="text-lg font-semibold mb-3">Espèces présentes</h2>
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

          <div className="p-4 rounded-lg border">
            <h3 className="font-semibold text-sm mb-2">Coordonnées</h3>
            <p className="text-sm text-muted-foreground font-mono">
              {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 w-full mt-2"
            >
              <Navigation className="h-4 w-4 mr-1" /> Itinéraire
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
