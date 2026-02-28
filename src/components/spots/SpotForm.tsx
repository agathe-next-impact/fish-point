'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createSpotSchema, type CreateSpotInput } from '@/validators/spot.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCreateSpot } from '@/hooks/useSpots';
import { useNotificationStore } from '@/store/notification.store';
import { WATER_TYPE_LABELS, FISHING_TYPE_LABELS } from '@/lib/constants';

const STEPS = ['Localisation', 'Informations', 'Espèces', 'Photos', 'Validation'];

export function SpotForm() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const createSpot = useCreateSpot();
  const addToast = useNotificationStore((s) => s.addToast);

  const form = useForm<CreateSpotInput>({
    resolver: zodResolver(createSpotSchema),
    defaultValues: {
      name: '',
      description: '',
      latitude: 0,
      longitude: 0,
      waterType: 'RIVER',
      fishingTypes: [],
      accessibility: { pmr: false, parking: false, boatLaunch: false, nightFishing: false },
      species: [],
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;
  const selectedFishingTypes = watch('fishingTypes');

  const onSubmit = async (data: CreateSpotInput) => {
    try {
      const result = await createSpot.mutateAsync(data);
      addToast({ type: 'success', title: 'Spot soumis avec succès !' });
      if (result.data) {
        router.push(`/spots/${result.data.slug}`);
      }
    } catch {
      addToast({ type: 'error', title: 'Erreur lors de la création du spot' });
    }
  };

  const toggleFishingType = (type: string) => {
    const current = selectedFishingTypes || [];
    const updated = current.includes(type as never)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setValue('fishingTypes', updated as CreateSpotInput['fishingTypes']);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {i + 1}
            </div>
            <span className="hidden sm:inline ml-2 text-sm">{label}</span>
            {i < STEPS.length - 1 && <div className="w-8 sm:w-16 h-px bg-muted mx-2" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Location */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Localisation du spot</h2>
            <p className="text-sm text-muted-foreground">Saisissez les coordonnées ou utilisez votre position actuelle.</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                step="any"
                placeholder="Latitude"
                {...register('latitude', { valueAsNumber: true })}
                error={errors.latitude?.message}
              />
              <Input
                type="number"
                step="any"
                placeholder="Longitude"
                {...register('longitude', { valueAsNumber: true })}
                error={errors.longitude?.message}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                  setValue('latitude', pos.coords.latitude);
                  setValue('longitude', pos.coords.longitude);
                });
              }}
            >
              Utiliser ma position
            </Button>
          </div>
        )}

        {/* Step 2: Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Informations</h2>
            <Input placeholder="Nom du spot" {...register('name')} error={errors.name?.message} />
            <textarea
              placeholder="Description (optionnel)"
              {...register('description')}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div>
              <label className="text-sm font-medium mb-2 block">Type d&apos;eau</label>
              <select {...register('waterType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {Object.entries(WATER_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Types de pêche</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(FISHING_TYPE_LABELS).map(([key, label]) => (
                  <Badge
                    key={key}
                    variant={selectedFishingTypes?.includes(key as never) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleFishingType(key)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
              {errors.fishingTypes && (
                <p className="text-xs text-destructive mt-1">{errors.fishingTypes.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Species */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Espèces présentes</h2>
            <p className="text-sm text-muted-foreground">Cette étape est optionnelle. Vous pourrez l&apos;ajouter plus tard.</p>
          </div>
        )}

        {/* Step 4: Photos */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Photos</h2>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Glissez-déposez vos photos ici ou cliquez pour sélectionner</p>
              <input type="file" accept="image/*" multiple className="hidden" />
              <Button variant="outline" className="mt-4">Sélectionner des photos</Button>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Récapitulatif</h2>
            <div className="rounded-lg border p-4 space-y-2">
              <p><strong>Nom :</strong> {watch('name')}</p>
              <p><strong>Coordonnées :</strong> {watch('latitude')}, {watch('longitude')}</p>
              <p><strong>Type d&apos;eau :</strong> {WATER_TYPE_LABELS[watch('waterType')]}</p>
              <p><strong>Pêche :</strong> {watch('fishingTypes')?.map(t => FISHING_TYPE_LABELS[t]).join(', ')}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Votre spot sera soumis à modération avant d&apos;être visible sur la carte.
            </p>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            Précédent
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}>
              Suivant
            </Button>
          ) : (
            <Button type="submit" isLoading={createSpot.isPending}>
              Soumettre le spot
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
