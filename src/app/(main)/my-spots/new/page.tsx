'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Map, { Marker, NavigationControl, type MapMouseEvent } from 'react-map-gl/mapbox';
import { MapPin } from 'lucide-react';
import { PrivateSpotForm } from '@/components/private-spots/PrivateSpotForm';
import { useCreatePrivateSpot } from '@/hooks/usePrivateSpots';
import { useNotificationStore } from '@/store/notification.store';
import { MAPBOX_TOKEN, MAP_STYLES, DEFAULT_CENTER } from '@/lib/mapbox';
import type { CreatePrivateSpotInput } from '@/validators/private-spot.schema';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function NewPrivateSpotPage() {
  const router = useRouter();
  const createSpot = useCreatePrivateSpot();
  const addToast = useNotificationStore((s) => s.addToast);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    const { lat, lng } = e.lngLat;
    setMarkerPosition({ lat, lng });
  }, []);

  const handleMarkerDragEnd = useCallback((e: { lngLat: { lat: number; lng: number } }) => {
    const { lat, lng } = e.lngLat;
    setMarkerPosition({ lat, lng });
  }, []);

  const handleSubmit = async (data: CreatePrivateSpotInput) => {
    try {
      await createSpot.mutateAsync(data);
      addToast({ type: 'success', title: 'Spot prive cree avec succes !' });
      router.push('/my-spots');
    } catch {
      addToast({ type: 'error', title: 'Erreur lors de la creation du spot' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Nouveau spot prive</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div>
          <PrivateSpotForm
            initialData={
              markerPosition
                ? { latitude: markerPosition.lat, longitude: markerPosition.lng }
                : undefined
            }
            onSubmit={handleSubmit}
            isSubmitting={createSpot.isPending}
            key={markerPosition ? `${markerPosition.lat}-${markerPosition.lng}` : 'no-marker'}
          />
        </div>

        {/* Map */}
        <div>
          <div className="sticky top-20">
            <label className="text-sm font-medium mb-2 block">
              Cliquez sur la carte pour placer le marqueur
            </label>
            <div className="h-[400px] rounded-lg overflow-hidden border">
              <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                  latitude: DEFAULT_CENTER.latitude,
                  longitude: DEFAULT_CENTER.longitude,
                  zoom: 6,
                }}
                mapStyle={MAP_STYLES.outdoors}
                style={{ width: '100%', height: '100%' }}
                onClick={handleMapClick}
                maxBounds={[[-10, 40], [12, 52]]}
                minZoom={4}
                maxZoom={18}
              >
                <NavigationControl position="top-right" />
                {markerPosition && (
                  <Marker
                    latitude={markerPosition.lat}
                    longitude={markerPosition.lng}
                    anchor="bottom"
                    draggable
                    onDragEnd={handleMarkerDragEnd}
                  >
                    <MapPin className="h-8 w-8 text-primary" fill="currentColor" />
                  </Marker>
                )}
              </Map>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
