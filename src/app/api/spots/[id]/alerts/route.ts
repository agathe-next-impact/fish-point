import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFlowStatusForCoords } from '@/services/hubeau-ecoulement.service';
import { findTronconForStation } from '@/services/vigicrues.service';
import { fetchFloodForecast } from '@/services/open-meteo-flood.service';

/**
 * GET /api/spots/:id/alerts
 * Returns real-time safety and environmental alerts for a spot.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const spot = await prisma.spot.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, latitude: true, longitude: true, hydroStationCode: true },
    });

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    const alerts: Array<{
      type: string;
      level: 'info' | 'warning' | 'danger';
      title: string;
      description: string;
      date?: string;
    }> = [];

    // Flow status (ONDE)
    try {
      const flow = await getFlowStatusForCoords(spot.latitude, spot.longitude);
      if (flow) {
        if (flow.status === 'dry') {
          alerts.push({
            type: 'flow',
            level: 'danger',
            title: 'Cours d\'eau à sec',
            description: `État relevé le ${flow.date} : ${flow.label}. Pêche impossible.`,
            date: flow.date,
          });
        } else if (flow.status === 'stagnant') {
          alerts.push({
            type: 'flow',
            level: 'warning',
            title: 'Écoulement non visible',
            description: `État relevé le ${flow.date} : ${flow.label}. Risque d'hypoxie.`,
            date: flow.date,
          });
        } else if (flow.status === 'weak_flow') {
          alerts.push({
            type: 'flow',
            level: 'info',
            title: 'Écoulement faible',
            description: `État relevé le ${flow.date} : ${flow.label}.`,
            date: flow.date,
          });
        }
      }
    } catch {
      // Non-critical
    }

    // Vigicrues flood vigilance
    if (spot.hydroStationCode) {
      try {
        const alert = await findTronconForStation(spot.hydroStationCode);
        if (alert && alert.level !== 'green') {
          const levelMap = { yellow: 'info', orange: 'warning', red: 'danger' } as const;
          const labels = {
            yellow: 'Vigilance jaune crues',
            orange: 'Vigilance orange crues',
            red: 'Vigilance rouge crues',
          } as const;

          alerts.push({
            type: 'flood',
            level: levelMap[alert.level as keyof typeof levelMap] || 'info',
            title: labels[alert.level as keyof typeof labels] || 'Vigilance crues',
            description: `Tronçon ${alert.tronconName} en vigilance ${alert.level}.`,
          });
        }
      } catch {
        // Non-critical
      }
    }

    // GloFAS 7-day flood forecast
    try {
      const flood = await fetchFloodForecast(spot.latitude, spot.longitude);
      if (flood && flood.riskLevel !== 'low') {
        const levelMap = { moderate: 'info', high: 'warning', extreme: 'danger' } as const;
        alerts.push({
          type: 'flood_forecast',
          level: levelMap[flood.riskLevel as keyof typeof levelMap] || 'info',
          title: flood.label,
          description: `Débit max prévu : ${flood.maxForecastDischarge} m³/s (pic le ${flood.peakDate}). Débit moyen : ${flood.meanDischarge} m³/s.`,
        });
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json({ data: alerts });
  } catch (error) {
    console.error('GET /api/spots/[id]/alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
