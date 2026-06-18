'use client';

import { LayoutGrid, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExplorerView } from '@/types/map';

interface ExplorerViewToggleProps {
  value: ExplorerView;
  onChange: (view: ExplorerView) => void;
  className?: string;
}

const OPTIONS: { value: ExplorerView; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'list', label: 'Liste', icon: LayoutGrid },
  { value: 'map', label: 'Carte', icon: MapIcon },
];

/**
 * Sélecteur Liste / Carte de l'écran Explorer.
 *
 * Bascule deux vues d'une même recherche sans naviguer : la vue choisie est
 * conservée dans le store (`map.store`) pour persister au changement de vue.
 * Pattern radiogroup pour l'accessibilité (rôle, état pressé, navigation focus).
 */
export function ExplorerViewToggle({ value, onChange, className }: ExplorerViewToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Affichage des résultats"
      className={cn(
        'flex shrink-0 items-center rounded-fs-md border border-line bg-card p-0.5',
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`Vue ${option.label.toLowerCase()}`}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-fs-muted hover:text-ink',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
