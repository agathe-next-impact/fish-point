import { checkDPFStatus } from './dpf.service';
import { checkLandOwnership } from './cadastre.service';
import { checkAgriculturalParcel } from './rpg.service';
import type { AccessType } from '@prisma/client';

export interface AccessSignal {
  source: string;
  signal: string;
  accessType: AccessType;
  confidence: 'high' | 'medium' | 'low';
  details?: string;
}

export interface AccessDetectionResult {
  accessType: AccessType | null;
  confidence: number;
  signals: AccessSignal[];
}

/**
 * Detect the access type of a spot by combining multiple data sources.
 *
 * Priority order:
 * 1. OSM tags (high confidence) — already stored in spot.osmTags
 * 2. Sandre DPF (high confidence)
 * 3. Cadastre/MAJIC (medium confidence)
 * 4. RPG agricultural parcel (low confidence)
 * 5. Georisques / validation signals (low confidence)
 */
export async function detectAccessType(spot: {
  latitude: number;
  longitude: number;
  osmTags?: Record<string, string> | null;
  confidenceDetails?: { signals?: Array<{ source: string; signal: string }> } | null;
}): Promise<AccessDetectionResult> {
  const signals: AccessSignal[] = [];
  const { latitude: lat, longitude: lon } = spot;

  // ─── 1. OSM tags (high confidence) ──────────────────────────
  const osmTags = spot.osmTags;
  if (osmTags) {
    const accessTag = osmTags.access;
    const feeTag = osmTags.fee;
    const permissionTag = osmTags.permission;

    if (accessTag === 'private') {
      signals.push({ source: 'osm', signal: 'access=private', accessType: 'PRIVATE', confidence: 'high' });
    } else if (accessTag === 'customers' || accessTag === 'destination') {
      signals.push({ source: 'osm', signal: `access=${accessTag}`, accessType: 'PAID', confidence: 'high' });
    } else if (accessTag === 'permit') {
      signals.push({ source: 'osm', signal: 'access=permit', accessType: 'FISHING_CARD', confidence: 'high' });
    } else if (accessTag === 'restricted') {
      signals.push({ source: 'osm', signal: 'access=restricted', accessType: 'RESTRICTED', confidence: 'high' });
    } else if (accessTag === 'members') {
      signals.push({ source: 'osm', signal: 'access=members', accessType: 'MEMBERS_ONLY', confidence: 'high' });
    } else if (accessTag === 'public' || accessTag === 'yes') {
      if (feeTag === 'yes') {
        signals.push({ source: 'osm', signal: 'access=public+fee=yes', accessType: 'PAID', confidence: 'high' });
      } else {
        signals.push({ source: 'osm', signal: `access=${accessTag}`, accessType: 'FREE', confidence: 'high' });
      }
    }

    if (!accessTag && feeTag === 'yes') {
      signals.push({ source: 'osm', signal: 'fee=yes', accessType: 'PAID', confidence: 'high' });
    } else if (!accessTag && feeTag === 'no') {
      signals.push({ source: 'osm', signal: 'fee=no', accessType: 'FREE', confidence: 'medium' });
    }

    if (permissionTag === 'private' && !accessTag) {
      signals.push({ source: 'osm', signal: 'permission=private', accessType: 'PRIVATE', confidence: 'high' });
    }

    if (osmTags.operator) {
      const op = osmTags.operator.toLowerCase();
      if (op.includes('aappma') || op.includes('federation') || op.includes('fédération')) {
        signals.push({
          source: 'osm',
          signal: 'operator_aappma',
          accessType: 'FISHING_CARD',
          confidence: 'high',
          details: osmTags.operator,
        });
      }
    }
  }

  // ─── 2-4. External API checks (parallel) ────────────────────
  const [dpf, cadastre, rpg] = await Promise.all([
    checkDPFStatus(lat, lon),
    checkLandOwnership(lat, lon),
    checkAgriculturalParcel(lat, lon),
  ]);

  // ─── 2. Sandre DPF (high confidence) ────────────────────────
  if (dpf.isDPF) {
    signals.push({
      source: 'dpf',
      signal: 'domaine_public_fluvial',
      accessType: 'FISHING_CARD',
      confidence: 'high',
      details: dpf.toponyme || dpf.gestionnaire || undefined,
    });
  }

  // ─── 3. Cadastre/MAJIC (medium confidence) ──────────────────
  if (cadastre.codeParcelle) {
    if (cadastre.ownerType === 'public') {
      signals.push({
        source: 'cadastre',
        signal: 'terrain_public',
        accessType: 'FREE',
        confidence: 'medium',
        details: cadastre.ownerName || `groupe ${cadastre.ownerGroupCode}`,
      });
    } else if (cadastre.ownerType === 'private') {
      signals.push({
        source: 'cadastre',
        signal: 'terrain_prive',
        accessType: 'PRIVATE',
        confidence: 'medium',
        details: cadastre.ownerName || undefined,
      });
    }
  }

  // ─── 4. RPG agricultural parcel (low confidence) ─────────────
  if (rpg.isInParcel) {
    signals.push({
      source: 'rpg',
      signal: 'parcelle_agricole',
      accessType: 'PRIVATE',
      confidence: 'low',
      details: rpg.cultureLabel,
    });
  }

  // ─── 5. Existing validation signals (low confidence) ─────────
  const valSignals = spot.confidenceDetails?.signals;
  if (Array.isArray(valSignals)) {
    for (const vs of valSignals) {
      if (vs.source === 'georisques' && vs.signal === 'livestock_nearby') {
        signals.push({
          source: 'georisques',
          signal: 'livestock_nearby',
          accessType: 'PRIVATE',
          confidence: 'low',
        });
      }
    }
  }

  // ─── Resolve final access type ───────────────────────────────
  return resolveAccessType(signals);
}

/**
 * Resolve the final access type from collected signals.
 * Uses a weighted voting system: high=3, medium=2, low=1.
 */
function resolveAccessType(signals: AccessSignal[]): AccessDetectionResult {
  if (signals.length === 0) {
    return { accessType: null, confidence: 0, signals };
  }

  const weights: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const votes: Record<string, number> = {};

  for (const s of signals) {
    const w = weights[s.confidence] || 1;
    votes[s.accessType] = (votes[s.accessType] || 0) + w;
  }

  // Find the access type with highest total weight
  let bestType: AccessType | null = null;
  let bestWeight = 0;
  let totalWeight = 0;

  for (const [type, weight] of Object.entries(votes)) {
    totalWeight += weight;
    if (weight > bestWeight) {
      bestWeight = weight;
      bestType = type as AccessType;
    }
  }

  // Confidence = best weight / total weight * 100, capped at 100
  const confidence = totalWeight > 0
    ? Math.min(100, Math.round((bestWeight / totalWeight) * 100))
    : 0;

  return { accessType: bestType, confidence, signals };
}
