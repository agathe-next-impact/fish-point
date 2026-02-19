import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { UserAvatar } from '@/components/community/UserAvatar';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Fish, Star, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findFirst({
    where: { OR: [{ username }, { id: username }] },
    select: {
      id: true, name: true, username: true, image: true, bio: true,
      level: true, xp: true, createdAt: true,
      _count: { select: { spots: true, catches: true, reviews: true } },
    },
  });

  if (!user) notFound();

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <UserAvatar name={user.name} image={user.image} size="lg" />
        <div>
          <h1 className="text-2xl font-bold">{user.name || user.username}</h1>
          {user.bio && <p className="text-muted-foreground text-sm">{user.bio}</p>}
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Calendar className="h-3 w-3" /> Membre depuis {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><MapPin className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{user._count.spots}</p><p className="text-xs text-muted-foreground">Spots</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Fish className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{user._count.catches}</p><p className="text-xs text-muted-foreground">Prises</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Star className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{user._count.reviews}</p><p className="text-xs text-muted-foreground">Avis</p></CardContent></Card>
      </div>
    </div>
  );
}
