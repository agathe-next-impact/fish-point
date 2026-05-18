'use client';

/**
 * Client-only runtime helpers for MapLibre.
 * Kept separate from `src/lib/map.ts` (pure helpers) so that server components
 * importing only `formatDistance` / `calculateBounds` don't pull maplibre-gl
 * into their bundle.
 */

import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';

let pmtilesRegistered = false;

/**
 * Registers the `pmtiles://` protocol on the global maplibre namespace.
 * Idempotent — safe to call multiple times.
 * No-op on the server.
 */
export function registerPmtilesProtocol(): void {
  if (pmtilesRegistered) return;
  if (typeof window === 'undefined') return;
  const protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);
  pmtilesRegistered = true;
}

// Auto-register at module load (client-side only via 'use client').
// Guarantees protocol is ready before any Map component starts fetching tiles,
// avoiding a race against useEffect ordering.
registerPmtilesProtocol();
