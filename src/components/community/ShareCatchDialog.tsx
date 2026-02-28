'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Share2 } from 'lucide-react';
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShareCatch } from '@/hooks/useFeed';
import { shareCatchSchema, type ShareCatchInput, type ShareCatchFormInput } from '@/validators/feed.schema';
import { useQuery } from '@tanstack/react-query';
import type { CatchData } from '@/types/catch';

export function ShareCatchDialog() {
  const [open, setOpen] = useState(false);
  const shareMutation = useShareCatch();

  const { data: catchesData, isLoading: catchesLoading } = useQuery({
    queryKey: ['catches', 'mine'],
    queryFn: async () => {
      const res = await fetch('/api/catches?limit=50');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ data: CatchData[] }>;
    },
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShareCatchFormInput, unknown, ShareCatchInput>({
    resolver: zodResolver(shareCatchSchema),
    defaultValues: {
      blurLocation: true,
    },
  });

  const onSubmit = (data: ShareCatchInput) => {
    shareMutation.mutate(
      {
        catchId: data.catchId,
        blurLocation: data.blurLocation,
        caption: data.caption,
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  };

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button>
          <Share2 className="h-4 w-4 mr-1" /> Partager une prise
        </Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Partager une prise</ModalTitle>
          <ModalDescription>
            Partagez une de vos prises avec la communauté.
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Catch selector */}
          <div>
            <label className="text-sm font-medium mb-1 block">Prise</label>
            <select
              {...register('catchId')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Sélectionner une prise...</option>
              {catchesLoading ? (
                <option disabled>Chargement...</option>
              ) : (
                catchesData?.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.species.name} - {c.spot.name} ({new Date(c.caughtAt).toLocaleDateString('fr-FR')})
                  </option>
                ))
              )}
            </select>
            {errors.catchId && (
              <p className="mt-1 text-xs text-destructive">{errors.catchId.message}</p>
            )}
          </div>

          {/* Blur location toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="blurLocation"
              {...register('blurLocation')}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="blurLocation" className="text-sm">
              Masquer la localisation précise (recommandé)
            </label>
          </div>

          {/* Caption */}
          <div>
            <label className="text-sm font-medium mb-1 block">Légende (optionnel)</label>
            <textarea
              {...register('caption')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Décrivez votre prise..."
              maxLength={500}
            />
            {errors.caption && (
              <p className="mt-1 text-xs text-destructive">{errors.caption.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={shareMutation.isPending}>
              Partager
            </Button>
          </div>

          {shareMutation.isError && (
            <p className="text-sm text-destructive">
              Erreur lors du partage. Cette prise est peut-être déjà partagée.
            </p>
          )}
        </form>
      </ModalContent>
    </Modal>
  );
}
