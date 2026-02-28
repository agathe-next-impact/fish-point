'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateGroup } from '@/hooks/useGroups';
import { createGroupSchema, type CreateGroupInput } from '@/validators/group.schema';

export default function NewGroupPage() {
  const router = useRouter();
  const createMutation = useCreateGroup();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
  });

  const onSubmit = (data: CreateGroupInput) => {
    createMutation.mutate(data, {
      onSuccess: (result) => {
        if (result.data) {
          router.push(`/community/groups/${result.data.id}`);
        }
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <Link
        href="/community/groups"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux groupes
      </Link>

      <h1 className="text-2xl font-bold mb-6">Créer un groupe</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Nom du groupe</label>
          <Input
            {...register('name')}
            placeholder="Ex: Les pêcheurs du dimanche"
            error={errors.name?.message}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Description (optionnel)</label>
          <textarea
            {...register('description')}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Décrivez votre groupe..."
            maxLength={500}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" isLoading={createMutation.isPending}>
          Créer le groupe
        </Button>

        {createMutation.isError && (
          <p className="text-sm text-destructive text-center">
            Erreur lors de la création du groupe.
          </p>
        )}
      </form>
    </div>
  );
}
