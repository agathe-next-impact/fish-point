import { describe, it, expect } from 'vitest';
import { normalizeNote, MAX_NOTE_LENGTH } from '@/lib/collections';

describe('normalizeNote', () => {
  it('trim les espaces de début et de fin', () => {
    expect(normalizeNote('  brochet au vif depuis la jetée  ')).toBe(
      'brochet au vif depuis la jetée',
    );
  });

  it('préserve les espaces internes et les retours à la ligne', () => {
    const note = 'Parking à 200 m.\nAccès par le ponton sud.';
    expect(normalizeNote(note)).toBe(note);
  });

  it('tronque à la longueur max', () => {
    const long = 'a'.repeat(MAX_NOTE_LENGTH + 50);
    expect(normalizeNote(long)).toHaveLength(MAX_NOTE_LENGTH);
  });

  it('renvoie null pour une note vide ou faite uniquement d’espaces (effacement)', () => {
    expect(normalizeNote('')).toBeNull();
    expect(normalizeNote('   ')).toBeNull();
    expect(normalizeNote('\n\t  ')).toBeNull();
  });

  it('renvoie null pour null ou undefined (effacement explicite)', () => {
    expect(normalizeNote(null)).toBeNull();
    expect(normalizeNote(undefined)).toBeNull();
  });

  it('préserve une note valide non vide', () => {
    expect(normalizeNote('Leurre souple en début de matinée')).toBe(
      'Leurre souple en début de matinée',
    );
  });
});
