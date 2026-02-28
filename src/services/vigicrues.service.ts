import { getCached } from '@/lib/redis';

const VIGICRUES_BASE = 'https://www.vigicrues.gouv.fr/services';

export type VigilanceLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface VigicruesTroncon {
  CdEntVigiCru: string;
  TypEntVigiCru: string;
  LbEntVigiCru: string;
  NivSituVigiCruEntVigiCru?: number; // 1=vert, 2=jaune, 3=orange, 4=rouge
}

export interface VigicruesAlert {
  tronconCode: string;
  tronconName: string;
  level: VigilanceLevel;
  levelNumber: number;
}

function parseLevel(niv: number | undefined): VigilanceLevel {
  switch (niv) {
    case 4: return 'red';
    case 3: return 'orange';
    case 2: return 'yellow';
    default: return 'green';
  }
}

/**
 * Scoring impact of flood vigilance level.
 * - green:   0  (no impact)
 * - yellow: -5  (minor concern)
 * - orange: -20 (significant risk, fish disturbed)
 * - red:    -40 (danger, no fishing recommended)
 */
export function getVigilanceScoreImpact(level: VigilanceLevel): number {
  switch (level) {
    case 'green': return 0;
    case 'yellow': return -5;
    case 'orange': return -20;
    case 'red': return -40;
    default: return 0;
  }
}

/**
 * Fetch all vigilance troncons with their current alert levels.
 * Cached for 30 minutes (Vigicrues updates twice daily).
 */
export async function fetchVigilanceTroncons(): Promise<VigicruesTroncon[]> {
  return getCached(
    'vigicrues:troncons',
    async () => {
      const res = await fetch(`${VIGICRUES_BASE}/TronEntVigiCru.json`);
      if (!res.ok) return [];

      const data = await res.json();
      return data.ListEntVigiCru ?? [];
    },
    1800, // 30 min
  );
}

/**
 * Fetch detailed info for a specific troncon (includes vigilance level).
 */
async function fetchTronconDetail(tronconCode: string): Promise<VigicruesTroncon | null> {
  try {
    const res = await fetch(
      `${VIGICRUES_BASE}/TronEntVigiCru.json?CdEntVigiCru=${tronconCode}&TypEntVigiCru=8`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    const troncon = data.ListEntVigiCru?.[0];
    return troncon ?? null;
  } catch {
    return null;
  }
}

/**
 * Find the best matching Vigicrues troncon for a hydro station.
 * Vigicrues troncons contain stations; we look up the station to troncon mapping.
 */
export async function findTronconForStation(
  hydroStationCode: string,
): Promise<VigicruesAlert | null> {
  const cacheKey = `vigicrues:station:${hydroStationCode}`;

  return getCached(
    cacheKey,
    async () => {
      try {
        // Search for the station in Vigicrues
        const res = await fetch(
          `${VIGICRUES_BASE}/StaEntVigiCru.json?CdStationHydro=${hydroStationCode}`,
        );
        if (!res.ok) return null;

        const data = await res.json();
        const station = data.ListEntVigiCru?.[0];
        if (!station?.CdEntVigiCru) return null;

        // Get the troncon detail for vigilance level
        const troncon = await fetchTronconDetail(station.CdEntVigiCru);
        if (!troncon) return null;

        return {
          tronconCode: troncon.CdEntVigiCru,
          tronconName: troncon.LbEntVigiCru,
          level: parseLevel(troncon.NivSituVigiCruEntVigiCru),
          levelNumber: troncon.NivSituVigiCruEntVigiCru ?? 1,
        };
      } catch {
        return null;
      }
    },
    1800,
  );
}

/**
 * Get vigilance alerts for all active troncons above green level.
 */
export async function getActiveAlerts(): Promise<VigicruesAlert[]> {
  const troncons = await fetchVigilanceTroncons();

  return troncons
    .filter((t) => (t.NivSituVigiCruEntVigiCru ?? 1) >= 2)
    .map((t) => ({
      tronconCode: t.CdEntVigiCru,
      tronconName: t.LbEntVigiCru,
      level: parseLevel(t.NivSituVigiCruEntVigiCru),
      levelNumber: t.NivSituVigiCruEntVigiCru ?? 1,
    }));
}
