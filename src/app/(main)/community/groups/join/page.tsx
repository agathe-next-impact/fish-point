'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useJoinGroup } from '@/hooks/useGroups';
import { joinGroupSchema, type JoinGroupInput } from '@/validators/group.schema';

export default function JoinGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinMutation = useJoinGroup();

  const codeFromUrl = searchParams.get('code') || '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<JoinGroupInput>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: {
      inviteCode: codeFromUrl,
    },
  });

  // If code is provided in URL, pre-fill the form
  useEffect(() => {
    if (codeFromUrl) {
      setValue('inviteCode', codeFromUrl);
    }
  }, [codeFromUrl, setValue]);

  const onSubmit = (data: JoinGroupInput) => {
    joinMutation.mutate(data.inviteCode, {
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

      <h1 className="text-2xl font-bold mb-6">Rejoindre un groupe</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Code d'invitation</label>
          <Input
            {...register('inviteCode')}
            placeholder="Collez le code d'invitation ici"
            error={errors.inviteCode?.message}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Demandez le code d'invitation au créateur du groupe.
          </p>
        </div>

        <Button type="submit" className="w-full" isLoading={joinMutation.isPending}>
          Rejoindre le groupe
        </Button>

        {joinMutation.isError && (
          <p className="text-sm text-destructive text-center">
            Code d'invitation invalide ou vous êtes déjà membre.
          </p>
        )}
      </form>
    </div>
  );
}
