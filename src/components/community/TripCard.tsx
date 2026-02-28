'use client';

import { Calendar, MapPin, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { GroupTrip } from '@/types/group';

interface TripCardProps {
  trip: GroupTrip;
}

export function TripCard({ trip }: TripCardProps) {
  const tripDate = new Date(trip.date);
  const isPast = tripDate < new Date();

  return (
    <Card className={isPast ? 'opacity-60' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{trip.title}</CardTitle>
          {isPast ? (
            <Badge variant="secondary">Passée</Badge>
          ) : (
            <Badge>A venir</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(trip.date, { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {trip.spot && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{trip.spot.name}</span>
            </div>
          )}
          {trip.creator && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>Organisé par {trip.creator.name || trip.creator.username}</span>
            </div>
          )}
        </div>
        {trip.description && (
          <p className="mt-2 text-sm">{trip.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
