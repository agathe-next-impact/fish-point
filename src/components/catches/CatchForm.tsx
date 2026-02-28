'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createCatchSchema, type CreateCatchInput } from '@/validators/catch.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotificationStore } from '@/store/notification.store';
import { useState } from 'react';

export function CatchForm() {
  const router = useRouter();
  const addToast = useNotificationStore((s) => s.addToast);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateCatchInput>({
    resolver: zodResolver(createCatchSchema),
    defaultValues: {
      isReleased: true,
    },
  });

  const onSubmit = async (data: CreateCatchInput) => {
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/catches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');

      addToast({ type: 'success', title: 'Prise enregistrée !' });
      router.push('/catches');
    } catch {
      addToast({ type: 'error', title: "Erreur lors de l'enregistrement" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold">Enregistrer une prise</h2>

      <Input placeholder="ID du spot" {...register('spotId')} error={errors.spotId?.message} />
      <Input placeholder="ID de l'espèce" {...register('speciesId')} error={errors.speciesId?.message} />

      <div className="grid grid-cols-2 gap-4">
        <Input type="number" step="any" placeholder="Poids (g)" {...register('weight', { valueAsNumber: true })} error={errors.weight?.message} />
        <Input type="number" step="any" placeholder="Taille (cm)" {...register('length', { valueAsNumber: true })} error={errors.length?.message} />
      </div>

      <Input placeholder="Technique" {...register('technique')} />
      <Input placeholder="Appât" {...register('bait')} />

      <textarea
        placeholder="Notes (optionnel)"
        {...register('notes')}
        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <label className="flex items-center gap-2">
        <input type="checkbox" {...register('isReleased')} className="rounded" />
        <span className="text-sm">Poisson relâché (no-kill)</span>
      </label>

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Enregistrer la prise
      </Button>
    </form>
  );
}
