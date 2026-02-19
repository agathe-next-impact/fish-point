'use client';

import { useSession } from 'next-auth/react';
import { UserAvatar } from '@/components/community/UserAvatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings, MapPin, Fish, Star } from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">Connectez-vous pour accéder à votre profil.</p>
        <Link href="/login"><Button>Se connecter</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <UserAvatar name={session.user.name || null} image={session.user.image || null} size="lg" />
        <div>
          <h1 className="text-2xl font-bold">{session.user.name}</h1>
          <p className="text-muted-foreground">{session.user.email}</p>
        </div>
        <Link href="/profile/settings" className="ml-auto">
          <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: MapPin, label: 'Spots', value: '0' },
          { icon: Fish, label: 'Prises', value: '0' },
          { icon: Star, label: 'Avis', value: '0' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <stat.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
