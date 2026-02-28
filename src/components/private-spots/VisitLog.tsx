'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createVisitSchema, type CreateVisitInput } from '@/validators/private-spot.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Plus, Calendar, MessageSquare } from 'lucide-react';
import type { PrivateSpotVisit } from '@/types/private-spot';

interface VisitLogProps {
  visits: PrivateSpotVisit[];
  onAddVisit: (data: CreateVisitInput) => void;
  isSubmitting?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

function VisitEntry({ visit }: { visit: PrivateSpotVisit }) {
  const conditions = visit.conditions as Record<string, unknown> | null;

  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border last:hidden" />
      {/* Timeline dot */}
      <div className="absolute left-0 top-1.5 h-[18px] w-[18px] rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-primary" />
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{formatDate(visit.visitDate)}</span>
        </div>

        {visit.rating && <RatingStars rating={visit.rating} />}

        {visit.notes && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>{visit.notes}</p>
          </div>
        )}

        {conditions && Object.keys(conditions).length > 0 && (
          <div className="text-xs text-muted-foreground bg-muted rounded-md p-2 mt-1">
            {Object.entries(conditions).map(([key, value]) => (
              <span key={key} className="mr-3">
                <strong>{key}:</strong> {String(value)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InlineVisitForm({ onSubmit, isSubmitting }: { onSubmit: (data: CreateVisitInput) => void; isSubmitting?: boolean }) {
  const [selectedRating, setSelectedRating] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<CreateVisitInput>({
    resolver: zodResolver(createVisitSchema),
    defaultValues: {
      notes: '',
      rating: undefined,
      conditions: undefined,
    },
  });

  const handleFormSubmit = (data: CreateVisitInput) => {
    onSubmit(data);
    reset();
    setSelectedRating(0);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 border rounded-lg p-4 bg-muted/30">
      <h4 className="text-sm font-semibold">Nouvelle visite</h4>

      {/* Rating */}
      <div>
        <label className="text-sm font-medium mb-1 block">Note</label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const newRating = i + 1;
                setSelectedRating(newRating);
                setValue('rating', newRating);
              }}
            >
              <Star
                className={`h-5 w-5 cursor-pointer transition-colors ${
                  i < selectedRating
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-muted-foreground/30 hover:text-yellow-300'
                }`}
              />
            </button>
          ))}
          {selectedRating > 0 && (
            <button
              type="button"
              className="ml-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSelectedRating(0);
                setValue('rating', undefined);
              }}
            >
              Effacer
            </button>
          )}
        </div>
        {errors.rating && (
          <p className="mt-1 text-xs text-destructive">{errors.rating.message}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium mb-1 block">Notes</label>
        <textarea
          placeholder="Comment s'est passee la session ?"
          {...register('notes')}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {errors.notes && (
          <p className="mt-1 text-xs text-destructive">{errors.notes.message}</p>
        )}
      </div>

      {/* Conditions */}
      <div>
        <label className="text-sm font-medium mb-1 block">Conditions (optionnel)</label>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Meteo" id="condition-weather" />
          <Input placeholder="Temperature eau" id="condition-waterTemp" />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Les conditions seront enregistrees comme notes supplementaires.
        </p>
      </div>

      <Button type="submit" size="sm" isLoading={isSubmitting}>
        Enregistrer la visite
      </Button>
    </form>
  );
}

export function VisitLog({ visits, onAddVisit, isSubmitting }: VisitLogProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Historique des visites ({visits.length})
        </h3>
        <Button
          variant={showForm ? 'outline' : 'default'}
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {showForm ? 'Annuler' : 'Ajouter une visite'}
        </Button>
      </div>

      {showForm && (
        <InlineVisitForm
          onSubmit={(data) => {
            onAddVisit(data);
            setShowForm(false);
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {visits.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Aucune visite enregistree. Ajoutez votre premiere visite !
        </p>
      ) : (
        <div className="mt-4">
          {visits.map((visit) => (
            <VisitEntry key={visit.id} visit={visit} />
          ))}
        </div>
      )}
    </div>
  );
}
