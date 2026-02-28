'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useCreateAlertSubscription, useFavoriteSpots } from '@/hooks/useAlerts';
import { Zap, Shield, Droplets, MapPin } from 'lucide-react';
import type { AlertType } from '@/types/alert';

const ALERT_TYPES: Array<{
  value: AlertType;
  label: string;
  description: string;
  icon: typeof Zap;
}> = [
  {
    value: 'IDEAL_CONDITIONS',
    label: 'Conditions ideales',
    description: 'Alerte quand les conditions de peche sont excellentes.',
    icon: Zap,
  },
  {
    value: 'REGULATION_REMINDER',
    label: 'Rappel reglementaire',
    description: 'Rappel des changements de reglementation et expiration carte.',
    icon: Shield,
  },
  {
    value: 'WATER_LEVEL_ABNORMAL',
    label: "Niveau d'eau anormal",
    description: 'Alerte en cas de crue ou etiage sur vos spots.',
    icon: Droplets,
  },
  {
    value: 'CUSTOM_SPOT_ACTIVITY',
    label: 'Activite sur un spot',
    description: 'Notification de nouvelles prises ou avis sur un spot.',
    icon: MapPin,
  },
];

interface CreateAlertFormProps {
  onSuccess?: () => void;
}

export function CreateAlertForm({ onSuccess }: CreateAlertFormProps) {
  const [selectedType, setSelectedType] = useState<AlertType>('IDEAL_CONDITIONS');
  const [selectedSpotId, setSelectedSpotId] = useState<string>('');
  const [threshold, setThreshold] = useState(75);
  const [department, setDepartment] = useState('');

  const createMutation = useCreateAlertSubscription();
  const { data: favorites, isLoading: favoritesLoading } = useFavoriteSpots();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const config: Record<string, unknown> = {};

    if (selectedType === 'IDEAL_CONDITIONS') {
      config.threshold = threshold;
    }

    if (selectedType === 'REGULATION_REMINDER' && department) {
      config.department = department;
    }

    try {
      await createMutation.mutateAsync({
        type: selectedType,
        spotId: selectedSpotId || undefined,
        config: Object.keys(config).length > 0 ? config : undefined,
        isActive: true,
      });
      onSuccess?.();
    } catch {
      // Error handled by the hook
    }
  };

  const showSpotPicker = selectedType !== 'REGULATION_REMINDER';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Type d&apos;alerte</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {ALERT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.value;
            return (
              <Card
                key={type.value}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'hover:border-muted-foreground/30'
                }`}
                onClick={() => {
                  setSelectedType(type.value);
                  setSelectedSpotId('');
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <input
                        type="radio"
                        name="alertType"
                        value={type.value}
                        checked={isSelected}
                        onChange={() => setSelectedType(type.value)}
                        className="sr-only"
                      />
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
                        {type.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Spot picker */}
      {showSpotPicker && (
        <div className="space-y-2">
          <label htmlFor="spotId" className="text-sm font-medium">
            Spot (optionnel)
          </label>
          <select
            id="spotId"
            value={selectedSpotId}
            onChange={(e) => setSelectedSpotId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Tous les spots favoris</option>
            {favoritesLoading && <option disabled>Chargement...</option>}
            {favorites?.map((fav: { spot: { id: string; name: string; department: string } }) => (
              <option key={fav.spot.id} value={fav.spot.id}>
                {fav.spot.name} ({fav.spot.department})
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Selectionnez un spot ou laissez vide pour surveiller tous vos favoris.
          </p>
        </div>
      )}

      {/* Config: IDEAL_CONDITIONS threshold */}
      {selectedType === 'IDEAL_CONDITIONS' && (
        <div className="space-y-3">
          <label className="text-sm font-medium">
            Seuil de score ({threshold}/100)
          </label>
          <Slider
            value={[threshold]}
            onValueChange={(values) => setThreshold(values[0])}
            min={60}
            max={90}
            step={5}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>60 - Plus d&apos;alertes</span>
            <span>90 - Conditions rares</span>
          </div>
        </div>
      )}

      {/* Config: REGULATION_REMINDER department */}
      {selectedType === 'REGULATION_REMINDER' && (
        <div className="space-y-2">
          <label htmlFor="department" className="text-sm font-medium">
            Departement (optionnel)
          </label>
          <Input
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Ex: 75, 33, 69..."
            maxLength={3}
          />
          <p className="text-xs text-muted-foreground">
            Filtrer les rappels pour un departement specifique.
          </p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        isLoading={createMutation.isPending}
        disabled={createMutation.isPending}
      >
        Creer l&apos;alerte
      </Button>
    </form>
  );
}
