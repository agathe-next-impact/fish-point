import { getCached } from '@/lib/redis';

const VIGIEAU_BASE = 'https://api.vigieau.gouv.fr/api';

export type DroughtLevel = 'vigilance' | 'alerte' | 'alerte_renforcee' | 'crise';

export interface DroughtRestriction {
  level: DroughtLevel;
  label: string;
  description: string;
  /** Fishing may be impacted or forbidden */
  fishingImpacted: boolean;
}

const LEVEL_LABELS: Record<DroughtLevel, string> = {
  vigilance: 'Vigilance',
  alerte: 'Alerte',
  alerte_renforcee: 'Alerte renforcée',
  crise: 'Crise',
};

/**
 * Fetch drought restrictions for given coordinates from VigiEau API.
 * Returns the most restrictive level found, or null if no restrictions.
 */
export async function fetchDroughtRestriction(
  lat: number,
  lon: number,
): Promise<DroughtRestriction | null> {
  const cacheKey = `vigieau:${lat.toFixed(2)}:${lon.toFixed(2)}`;

  return getCached(cacheKey, async () => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
    });

    const res = await fetch(`${VIGIEAU_BASE}/zones?${params}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`VigiEau error: ${res.status}`);
    }

    const zones: Array<{
      niveauGravite?: string;
      type?: string;
      arrete?: { cheminFichierArrete?: string };
    }> = await res.json();

    if (!zones || zones.length === 0) return null;

    // Find the most restrictive level across all zones
    const levelPriority: DroughtLevel[] = ['crise', 'alerte_renforcee', 'alerte', 'vigilance'];
    let worstLevel: DroughtLevel | null = null;

    for (const zone of zones) {
      const raw = zone.niveauGravite?.toLowerCase().replace(/\s+/g, '_').replace(/é/g, 'e') ?? '';
      for (const level of levelPriority) {
        if (raw.includes(level.replace('_', '')) || raw.includes(level)) {
          if (!worstLevel || levelPriority.indexOf(level) < levelPriority.indexOf(worstLevel)) {
            worstLevel = level;
          }
          break;
        }
      }
    }

    if (!worstLevel) return null;

    return {
      level: worstLevel,
      label: LEVEL_LABELS[worstLevel],
      description: `Restriction sécheresse : ${LEVEL_LABELS[worstLevel]}`,
      fishingImpacted: worstLevel === 'alerte_renforcee' || worstLevel === 'crise',
    };
  }, 3600); // 1 hour cache
}

/**
 * Get scoring impact from drought restriction level.
 */
export function getDroughtScoreImpact(level: DroughtLevel): number {
  switch (level) {
    case 'vigilance': return -5;
    case 'alerte': return -15;
    case 'alerte_renforcee': return -30;
    case 'crise': return -50;
  }
}
