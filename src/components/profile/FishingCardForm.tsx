'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFishingCardSchema, type CreateFishingCardFormInput } from '@/validators/fishing-card.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadImage, validateImageFile } from '@/services/upload.service';
import { useNotificationStore } from '@/store/notification.store';
import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import type { FishingCard } from '@/types/fishing-card';

const FRENCH_DEPARTMENTS = [
  { code: '01', name: 'Ain' }, { code: '02', name: 'Aisne' }, { code: '03', name: 'Allier' },
  { code: '04', name: 'Alpes-de-Haute-Provence' }, { code: '05', name: 'Hautes-Alpes' },
  { code: '06', name: 'Alpes-Maritimes' }, { code: '07', name: 'Ardeche' }, { code: '08', name: 'Ardennes' },
  { code: '09', name: 'Ariege' }, { code: '10', name: 'Aube' }, { code: '11', name: 'Aude' },
  { code: '12', name: 'Aveyron' }, { code: '13', name: 'Bouches-du-Rhone' }, { code: '14', name: 'Calvados' },
  { code: '15', name: 'Cantal' }, { code: '16', name: 'Charente' }, { code: '17', name: 'Charente-Maritime' },
  { code: '18', name: 'Cher' }, { code: '19', name: 'Correze' }, { code: '2A', name: 'Corse-du-Sud' },
  { code: '2B', name: 'Haute-Corse' }, { code: '21', name: "Cote-d'Or" }, { code: '22', name: "Cotes-d'Armor" },
  { code: '23', name: 'Creuse' }, { code: '24', name: 'Dordogne' }, { code: '25', name: 'Doubs' },
  { code: '26', name: 'Drome' }, { code: '27', name: 'Eure' }, { code: '28', name: 'Eure-et-Loir' },
  { code: '29', name: 'Finistere' }, { code: '30', name: 'Gard' }, { code: '31', name: 'Haute-Garonne' },
  { code: '32', name: 'Gers' }, { code: '33', name: 'Gironde' }, { code: '34', name: 'Herault' },
  { code: '35', name: 'Ille-et-Vilaine' }, { code: '36', name: 'Indre' }, { code: '37', name: 'Indre-et-Loire' },
  { code: '38', name: 'Isere' }, { code: '39', name: 'Jura' }, { code: '40', name: 'Landes' },
  { code: '41', name: 'Loir-et-Cher' }, { code: '42', name: 'Loire' }, { code: '43', name: 'Haute-Loire' },
  { code: '44', name: 'Loire-Atlantique' }, { code: '45', name: 'Loiret' }, { code: '46', name: 'Lot' },
  { code: '47', name: 'Lot-et-Garonne' }, { code: '48', name: 'Lozere' }, { code: '49', name: 'Maine-et-Loire' },
  { code: '50', name: 'Manche' }, { code: '51', name: 'Marne' }, { code: '52', name: 'Haute-Marne' },
  { code: '53', name: 'Mayenne' }, { code: '54', name: 'Meurthe-et-Moselle' }, { code: '55', name: 'Meuse' },
  { code: '56', name: 'Morbihan' }, { code: '57', name: 'Moselle' }, { code: '58', name: 'Nievre' },
  { code: '59', name: 'Nord' }, { code: '60', name: 'Oise' }, { code: '61', name: 'Orne' },
  { code: '62', name: 'Pas-de-Calais' }, { code: '63', name: 'Puy-de-Dome' },
  { code: '64', name: 'Pyrenees-Atlantiques' }, { code: '65', name: 'Hautes-Pyrenees' },
  { code: '66', name: 'Pyrenees-Orientales' }, { code: '67', name: 'Bas-Rhin' }, { code: '68', name: 'Haut-Rhin' },
  { code: '69', name: 'Rhone' }, { code: '70', name: 'Haute-Saone' }, { code: '71', name: 'Saone-et-Loire' },
  { code: '72', name: 'Sarthe' }, { code: '73', name: 'Savoie' }, { code: '74', name: 'Haute-Savoie' },
  { code: '75', name: 'Paris' }, { code: '76', name: 'Seine-Maritime' }, { code: '77', name: 'Seine-et-Marne' },
  { code: '78', name: 'Yvelines' }, { code: '79', name: 'Deux-Sevres' }, { code: '80', name: 'Somme' },
  { code: '81', name: 'Tarn' }, { code: '82', name: 'Tarn-et-Garonne' }, { code: '83', name: 'Var' },
  { code: '84', name: 'Vaucluse' }, { code: '85', name: 'Vendee' }, { code: '86', name: 'Vienne' },
  { code: '87', name: 'Haute-Vienne' }, { code: '88', name: 'Vosges' }, { code: '89', name: 'Yonne' },
  { code: '90', name: 'Territoire de Belfort' }, { code: '91', name: 'Essonne' },
  { code: '92', name: 'Hauts-de-Seine' }, { code: '93', name: 'Seine-Saint-Denis' },
  { code: '94', name: 'Val-de-Marne' }, { code: '95', name: "Val-d'Oise" },
  { code: '971', name: 'Guadeloupe' }, { code: '972', name: 'Martinique' },
  { code: '973', name: 'Guyane' }, { code: '974', name: 'La Reunion' }, { code: '976', name: 'Mayotte' },
];

const RECIPROCITY_TYPES = [
  { value: 'EHGO', label: 'EHGO' },
  { value: 'CHI', label: 'CHI' },
  { value: 'URNE', label: 'URNE' },
  { value: 'InterFederale', label: 'Interfederale' },
] as const;

interface FishingCardFormProps {
  initialData?: FishingCard;
  onSubmit: (data: CreateFishingCardFormInput) => void;
  isSubmitting: boolean;
}

function toDateInputValue(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

export function FishingCardForm({ initialData, onSubmit, isSubmitting }: FishingCardFormProps) {
  const addToast = useNotificationStore((s) => s.addToast);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateFishingCardFormInput>({
    resolver: zodResolver(createFishingCardSchema),
    defaultValues: {
      cardNumber: initialData?.cardNumber ?? undefined,
      aappma: initialData?.aappma ?? undefined,
      department: initialData?.department ?? undefined,
      federation: initialData?.federation ?? undefined,
      startDate: initialData?.startDate ?? undefined,
      endDate: initialData?.endDate ?? undefined,
      hasReciprocity: initialData?.hasReciprocity ?? false,
      reciprocityType: (initialData?.reciprocityType as CreateFishingCardFormInput['reciprocityType']) ?? undefined,
      imageUrl: initialData?.imageUrl ?? undefined,
    },
  });

  const hasReciprocity = watch('hasReciprocity');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      addToast({ type: 'error', title: validationError });
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadImage(file);
      setValue('imageUrl', url);
      setImagePreview(url);
      addToast({ type: 'success', title: 'Photo importee' });
    } catch {
      addToast({ type: 'error', title: "Erreur lors de l'import de la photo" });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setValue('imageUrl', undefined);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = (data: CreateFishingCardFormInput) => {
    // Convert date inputs to ISO datetime strings
    const formattedData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : data.startDate,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : data.endDate,
    };
    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        placeholder="Numero de carte"
        {...register('cardNumber')}
        error={errors.cardNumber?.message}
      />

      <Input
        placeholder="AAPPMA"
        {...register('aappma')}
        error={errors.aappma?.message}
      />

      <div>
        <select
          {...register('department')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue=""
        >
          <option value="" disabled>Departement</option>
          {FRENCH_DEPARTMENTS.map((dept) => (
            <option key={dept.code} value={dept.code}>
              {dept.code} - {dept.name}
            </option>
          ))}
        </select>
        {errors.department?.message && (
          <p className="mt-1 text-xs text-destructive">{errors.department.message}</p>
        )}
      </div>

      <Input
        placeholder="Federation"
        {...register('federation')}
        error={errors.federation?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Date de debut</label>
          <Input
            type="date"
            {...register('startDate')}
            defaultValue={toDateInputValue(initialData?.startDate)}
            error={errors.startDate?.message}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Date de fin</label>
          <Input
            type="date"
            {...register('endDate')}
            defaultValue={toDateInputValue(initialData?.endDate)}
            error={errors.endDate?.message}
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('hasReciprocity')}
            className="rounded"
          />
          <span className="text-sm">Reciprocite</span>
        </label>

        {hasReciprocity && (
          <div>
            <select
              {...register('reciprocityType')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue=""
            >
              <option value="" disabled>Type de reciprocite</option>
              {RECIPROCITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.reciprocityType?.message && (
              <p className="mt-1 text-xs text-destructive">{errors.reciprocityType.message}</p>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Photo de la carte</label>
        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Apercu carte de peche"
              className="w-full max-w-xs rounded-md border object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input p-6 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Upload className="h-8 w-8 mb-2" />
            <p className="text-sm">Cliquer pour importer une photo</p>
            <p className="text-xs mt-1">JPG, PNG ou WebP (max 5 Mo)</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      <Button type="submit" className="w-full" isLoading={isSubmitting || isUploading} disabled={isUploading}>
        {initialData ? 'Mettre a jour' : 'Ajouter la carte'}
      </Button>
    </form>
  );
}
