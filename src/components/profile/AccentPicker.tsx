'use client';

import { Check } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import type { AccentTheme } from '@/store/user.store';
import { cn } from '@/lib/utils';

const ACCENTS: { key: AccentTheme; label: string; color: string }[] = [
  { key: 'lac', label: 'Lac', color: '#0e8c7f' },
  { key: 'ocean', label: 'Océan', color: '#1d6fa5' },
  { key: 'foret', label: 'Forêt', color: '#2f8f5b' },
  { key: 'coucher', label: 'Coucher', color: '#d98a1c' },
];

export function AccentPicker() {
  const { accent, setAccent } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACCENTS.map((option) => {
        const active = accent === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => setAccent(option.key)}
            aria-pressed={active}
            className={cn(
              'flex items-center gap-2.5 rounded-fs-md border p-3 text-left transition-all',
              active ? 'border-primary shadow-fs-sm' : 'border-line hover:border-faint',
            )}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: option.color }}
            >
              {active && <Check className="h-4 w-4" strokeWidth={3} />}
            </span>
            <span className="text-sm font-semibold text-ink">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
