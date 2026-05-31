'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Map, { Marker, NavigationControl, type MapMouseEvent } from 'react-map-gl/maplibre';
import { MapPin } from 'lucide-react';
import { PrivateSpotForm } from '@/components/private-spots/PrivateSpotForm';
import { useCreatePrivateSpot } from '@/hooks/usePrivateSpots';
import { useNotificationStore } from '@/store/notification.store';
import { DEFAULT_CENTER, MAP_MAX_BOUNDS, getDefaultVectorStyle } from '@/lib/map';
import '@/lib/map-runtime';
import type { CreatePrivateSpotInput } from '@/validators/private-spot.schema';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function NewPrivateSpotPage() {
  const router = useRouter();
  const createSpot = useCreatePrivateSpot();
  const addToast = useNotificationStore((s) => s.addToast);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);

  const mapStyle = useMemo(() => getDefaultVectorStyle(), []);

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
      <h1 className="fs-dsp text-2xl font-extrabold text-ink mb-6">Nouveau spot prive</h1>

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
                initialViewState={{
                  latitude: DEFAULT_CENTER.latitude,
                  longitude: DEFAULT_CENTER.longitude,
                  zoom: 6,
                }}
                mapStyle={mapStyle}
                style={{ width: '100%', height: '100%' }}
                onClick={handleMapClick}
                maxBounds={MAP_MAX_BOUNDS}
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
