'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2, Calendar, MapPin, Shield } from 'lucide-react';
import type { FishingCard } from '@/types/fishing-card';

interface FishingCardDisplayProps {
  card: FishingCard;
  onEdit: (card: FishingCard) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getExpiryBadge(card: FishingCard) {
  if (card.isExpired) {
    return <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Expiree</Badge>;
  }
  if (card.daysRemaining <= 7) {
    return <Badge variant="danger">Expire dans {card.daysRemaining} jour{card.daysRemaining > 1 ? 's' : ''}</Badge>;
  }
  if (card.isExpiringSoon) {
    return <Badge variant="warning">Expire dans {card.daysRemaining} jours</Badge>;
  }
  return <Badge variant="success">Expire dans {card.daysRemaining} jours</Badge>;
}

function getReciprocityLabel(type: string | null): string {
  switch (type) {
    case 'EHGO': return 'EHGO';
    case 'CHI': return 'CHI';
    case 'URNE': return 'URNE';
    case 'InterFederale': return 'Interfederale';
    default: return 'Reciprocite';
  }
}

export function FishingCardDisplay({ card, onEdit, onDelete }: FishingCardDisplayProps) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-semibold text-sm">Carte de Peche</span>
          </div>
          {getExpiryBadge(card)}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {card.cardNumber && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Numero</span>
            <span className="text-sm font-mono font-medium">{card.cardNumber}</span>
          </div>
        )}

        {card.aappma && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">AAPPMA</span>
            <span className="text-sm font-medium">{card.aappma}</span>
          </div>
        )}

        {card.department && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Departement</span>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{card.department}</span>
            </div>
          </div>
        )}

        {card.federation && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Federation</span>
            <span className="text-sm font-medium">{card.federation}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Validite</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">
              {formatDate(card.startDate)} - {formatDate(card.endDate)}
            </span>
          </div>
        </div>

        {card.hasReciprocity && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Reciprocite</span>
            <Badge variant="default">{getReciprocityLabel(card.reciprocityType)}</Badge>
          </div>
        )}

        {card.imageUrl && (
          <div className="pt-2">
            <img
              src={card.imageUrl}
              alt="Photo de la carte de peche"
              className="w-full rounded-md border object-cover max-h-48"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(card)}
          >
            <Pencil className="h-3 w-3 mr-1" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(card.id)}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
