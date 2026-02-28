'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPrivateSpotSchema, type CreatePrivateSpotInput, type CreatePrivateSpotFormInput } from '@/validators/private-spot.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

const ICON_OPTIONS = [
  { value: 'pin', label: 'Pin' },
  { value: 'star', label: 'Etoile' },
  { value: 'fish', label: 'Poisson' },
  { value: 'anchor', label: 'Ancre' },
  { value: 'flag', label: 'Drapeau' },
] as const;

interface PrivateSpotFormProps {
  initialData?: Partial<CreatePrivateSpotInput>;
  onSubmit: (data: CreatePrivateSpotInput) => void;
  isSubmitting?: boolean;
}

export function PrivateSpotForm({ initialData, onSubmit, isSubmitting }: PrivateSpotFormProps) {
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreatePrivateSpotFormInput, unknown, CreatePrivateSpotInput>({
    resolver: zodResolver(createPrivateSpotSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      latitude: initialData?.latitude || 0,
      longitude: initialData?.longitude || 0,
      color: initialData?.color || '#3b82f6',
      icon: initialData?.icon || 'pin',
      notes: initialData?.notes || '',
      tags: initialData?.tags || [],
    },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');
  const tags = watch('tags') || [];

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && tags.length < 10 && !tags.includes(trimmed)) {
      setValue('tags', [...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setValue('tags', tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div>
        <label className="text-sm font-medium mb-2 block">Nom du spot *</label>
        <Input placeholder="Mon spot secret" {...register('name')} error={errors.name?.message} />
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium mb-2 block">Description</label>
        <textarea
          placeholder="Decrivez votre spot..."
          {...register('description')}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Coordinates */}
      <div>
        <label className="text-sm font-medium mb-2 block">Coordonnees</label>
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
        <p className="mt-1 text-xs text-muted-foreground">
          Cliquez sur la carte pour placer le marqueur ou saisissez les coordonnees manuellement.
        </p>
      </div>

      {/* Color */}
      <div>
        <label className="text-sm font-medium mb-2 block">Couleur</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setValue('color', color)}
              aria-label={`Couleur ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Icon */}
      <div>
        <label className="text-sm font-medium mb-2 block">Icone</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedIcon}
          onChange={(e) => setValue('icon', e.target.value)}
        >
          {ICON_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium mb-2 block">Notes personnelles</label>
        <textarea
          placeholder="Vos notes privees sur ce spot..."
          {...register('notes')}
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {errors.notes && (
          <p className="mt-1 text-xs text-destructive">{errors.notes.message}</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium mb-2 block">Tags (max 10)</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ajouter un tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            disabled={tags.length >= 10}
          />
          <Button type="button" variant="outline" onClick={addTag} disabled={tags.length >= 10}>
            Ajouter
          </Button>
        </div>
        {errors.tags && (
          <p className="mt-1 text-xs text-destructive">{errors.tags.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        {initialData?.name ? 'Mettre a jour' : 'Creer le spot prive'}
      </Button>
    </form>
  );
}
