'use client';

import Link from 'next/link';
import { Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GroupCard } from '@/components/community/GroupCard';
import { useMyGroups } from '@/hooks/useGroups';

export default function GroupsPage() {
  const { data, isLoading } = useMyGroups();

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mes groupes</h1>
        <div className="flex gap-2">
          <Link href="/community/groups/join">
            <Button variant="outline">
              <UserPlus className="h-4 w-4 mr-1" /> Rejoindre
            </Button>
          </Link>
          <Link href="/community/groups/new">
            <Button>
              <Plus className="h-4 w-4 mr-1" /> Créer un groupe
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">Vous ne faites partie d'aucun groupe.</p>
          <p className="text-sm text-muted-foreground">
            Créez un groupe ou rejoignez-en un avec un code d'invitation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.data?.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
