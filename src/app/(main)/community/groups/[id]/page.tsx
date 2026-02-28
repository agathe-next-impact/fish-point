'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Copy, Check, Plus, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal';
import { UserAvatar } from '@/components/community/UserAvatar';
import { TripCard } from '@/components/community/TripCard';
import { useGroup, useCreateTrip } from '@/hooks/useGroups';
import { createTripSchema, type CreateTripInput } from '@/validators/group.schema';
import { formatDate } from '@/lib/utils';

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useGroup(id);
  const [copied, setCopied] = useState(false);
  const [tripModalOpen, setTripModalOpen] = useState(false);

  const group = data?.data;

  const handleCopyInviteCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32 mb-4" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl text-center">
        <p className="text-muted-foreground">Groupe introuvable ou accès refusé.</p>
        <Link href="/community/groups" className="text-primary text-sm mt-2 inline-block">
          Retour aux groupes
        </Link>
      </div>
    );
  }

  const now = new Date();
  const upcomingTrips = group.trips?.filter((t) => new Date(t.date) >= now) || [];
  const pastTrips = group.trips?.filter((t) => new Date(t.date) < now) || [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link
        href="/community/groups"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux groupes
      </Link>

      {/* Group header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{group.name}</h1>
        {group.description && (
          <p className="text-muted-foreground">{group.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Créé le {formatDate(group.createdAt)}
        </p>
      </div>

      {/* Invite code */}
      <div className="bg-muted/50 rounded-lg p-4 mb-6">
        <p className="text-sm font-medium mb-2">Code d'invitation</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-background rounded px-3 py-2 text-sm font-mono border">
            {group.inviteCode}
          </code>
          <Button variant="outline" size="icon" onClick={handleCopyInviteCode}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Partagez ce code pour inviter des amis.
        </p>
      </div>

      {/* Members */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5" /> Membres ({group.members?.length || 0})
        </h2>
        <div className="space-y-2">
          {group.members?.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <UserAvatar name={member.user.name} image={member.user.image} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {member.user.name || member.user.username || 'Anonyme'}
                </p>
              </div>
              {member.role === 'ADMIN' && (
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Sorties
          </h2>
          <Modal open={tripModalOpen} onOpenChange={setTripModalOpen}>
            <ModalTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Planifier une sortie
              </Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Planifier une sortie</ModalTitle>
                <ModalDescription>
                  Organisez une sortie de pêche avec votre groupe.
                </ModalDescription>
              </ModalHeader>
              <CreateTripForm
                groupId={group.id}
                onSuccess={() => setTripModalOpen(false)}
              />
            </ModalContent>
          </Modal>
        </div>

        {upcomingTrips.length === 0 && pastTrips.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aucune sortie planifiée.
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
            {pastTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateTripForm({
  groupId,
  onSuccess,
}: {
  groupId: string;
  onSuccess: () => void;
}) {
  const createTripMutation = useCreateTrip();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTripInput>({
    resolver: zodResolver(createTripSchema),
  });

  const onSubmit = (data: CreateTripInput) => {
    createTripMutation.mutate(
      { groupId, data },
      { onSuccess },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Titre</label>
        <Input
          {...register('title')}
          placeholder="Ex: Sortie carnassier lac du Bourget"
          error={errors.title?.message}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Date et heure</label>
        <Input
          type="datetime-local"
          {...register('date')}
          error={errors.date?.message}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Description (optionnel)</label>
        <textarea
          {...register('description')}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Détails sur la sortie..."
          maxLength={500}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" isLoading={createTripMutation.isPending}>
          Créer la sortie
        </Button>
      </div>

      {createTripMutation.isError && (
        <p className="text-sm text-destructive">Erreur lors de la création de la sortie.</p>
      )}
    </form>
  );
}
