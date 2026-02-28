'use client';

import Link from 'next/link';
import { Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { truncate } from '@/lib/utils';
import type { FishingGroup } from '@/types/group';

interface GroupCardProps {
  group: FishingGroup;
}

export function GroupCard({ group }: GroupCardProps) {
  // Find the next upcoming trip
  const now = new Date();
  const nextTrip = group.trips
    ?.filter((t) => new Date(t.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  return (
    <Link href={`/community/groups/${group.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{group.name}</CardTitle>
          {group.description && (
            <CardDescription>{truncate(group.description, 100)}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {group._count?.members ?? 0} membre{(group._count?.members ?? 0) > 1 ? 's' : ''}
            </span>
            {nextTrip && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Prochaine sortie : {new Date(nextTrip.date).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
