'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import { MapPin, Star, Fish, Anchor, Flag, Lock, ArrowLeft, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { VisitLog } from '@/components/private-spots/VisitLog';
import { usePrivateSpot, useDeletePrivateSpot, useLogVisit } from '@/hooks/usePrivateSpots';
import { useNotificationStore } from '@/store/notification.store';
import { MAPBOX_TOKEN, MAP_STYLES } from '@/lib/mapbox';
import type { CreateVisitInput } from '@/validators/private-spot.schema';
import 'mapbox-gl/dist/mapbox-gl.css';

function getIconComponent(icon: string | null) {
  switch (icon) {
    case 'star': return Star;
    case 'fish': return Fish;
    case 'anchor': return Anchor;
    case 'flag': return Flag;
    default: return MapPin;
  }
}

export default function PrivateSpotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const addToast = useNotificationStore((s) => s.addToast);

  const { data, isLoading } = usePrivateSpot(id);
  const deleteSpot = useDeletePrivateSpot();
  const logVisitMutation = useLogVisit(id);

  const spot = data?.data;

  const handleDelete = async () => {
    if (!confirm('Supprimer ce spot prive ? Cette action est irreversible.')) return;
    try {
      await deleteSpot.mutateAsync(id);
      addToast({ type: 'success', title: 'Spot supprime' });
      router.push('/my-spots');
    } catch {
      addToast({ type: 'error', title: 'Erreur lors de la suppression' });
    }
  };

  const handleAddVisit = async (visitData: CreateVisitInput) => {
    try {
      await logVisitMutation.mutateAsync(visitData);
      addToast({ type: 'success', title: 'Visite enregistree !' });
    } catch {
      addToast({ type: 'error', title: 'Erreur lors de l\'enregistrement' });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Spot introuvable.</p>
        <Link href="/my-spots">
          <Button variant="outline" className="mt-4">Retour</Button>
        </Link>
      </div>
    );
  }

  const IconComponent = getIconComponent(spot.icon);
  const color = spot.color || '#3b82f6';

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/my-spots">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center h-8 w-8 rounded-full"
              style={{ backgroundColor: color }}
            >
              <IconComponent className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold">{spot.name}</h1>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleteSpot.isPending}>
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {spot.description && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{spot.description}</p>
            </div>
          )}

          {/* Notes */}
          {spot.notes && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Notes personnelles</h2>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{spot.notes}</p>
              </div>
            </div>
          )}

          {/* Tags */}
          {spot.tags.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {spot.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Visit history */}
          <VisitLog
            visits={(spot.visits || []).map((v: { id: string; privateSpotId: string; visitDate: string; notes: string | null; rating: number | null; conditions: Record<string, unknown> | null }) => ({
              ...v,
              visitDate: typeof v.visitDate === 'string' ? v.visitDate : new Date(v.visitDate).toISOString(),
            }))}
            onAddVisit={handleAddVisit}
            isSubmitting={logVisitMutation.isPending}
          />
        </div>

        {/* Sidebar with map */}
        <div className="space-y-4">
          <div className="sticky top-20">
            {/* Mini map */}
            <div className="h-64 rounded-lg overflow-hidden border">
              <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                  latitude: spot.latitude,
                  longitude: spot.longitude,
                  zoom: 13,
                }}
                mapStyle={MAP_STYLES.outdoors}
                style={{ width: '100%', height: '100%' }}
                interactive={false}
              >
                <Marker
                  latitude={spot.latitude}
                  longitude={spot.longitude}
                  anchor="bottom"
                >
                  <div
                    className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: color }}
                  >
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                </Marker>
              </Map>
            </div>

            {/* Coordinates */}
            <div className="text-sm text-muted-foreground mt-2">
              <p>Latitude : {spot.latitude.toFixed(6)}</p>
              <p>Longitude : {spot.longitude.toFixed(6)}</p>
            </div>

            {/* Meta */}
            <div className="text-xs text-muted-foreground mt-4 space-y-1">
              <p>Cree le {new Date(spot.createdAt).toLocaleDateString('fr-FR')}</p>
              <p>Mis a jour le {new Date(spot.updatedAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
