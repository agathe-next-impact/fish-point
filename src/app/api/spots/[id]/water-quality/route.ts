import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface QualityParameter {
  parameter: string;
  label: string;
  value: number;
  unit: string;
  quality: 'good' | 'average' | 'poor';
  measurementDate: string;
}

function assessQuality(parameter: string, value: number): 'good' | 'average' | 'poor' {
  switch (parameter) {
    case 'dissolved_oxygen':
      if (value >= 7) return 'good';
      if (value >= 5) return 'average';
      return 'poor';
    case 'ph':
      if (value >= 6.5 && value <= 8.5) return 'good';
      if (value >= 6 && value <= 9) return 'average';
      return 'poor';
    case 'nitrates':
      if (value < 10) return 'good';
      if (value < 25) return 'average';
      return 'poor';
    case 'ammonium':
      if (value < 0.5) return 'good';
      if (value < 1.0) return 'average';
      return 'poor';
    case 'phosphates':
      if (value < 0.1) return 'good';
      if (value < 0.3) return 'average';
      return 'poor';
    default:
      return 'average';
  }
}

const PARAMETER_LABELS: Record<string, string> = {
  dissolved_oxygen: 'Oxygène dissous',
  ph: 'pH',
  nitrates: 'Nitrates',
  ammonium: 'Ammonium',
  phosphates: 'Phosphates',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const spot = await prisma.spot.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    // Get latest measurement per parameter
    const snapshots = await prisma.waterQualitySnapshot.findMany({
      where: { spotId: spot.id },
      orderBy: { measurementDate: 'desc' },
    });

    // Keep only the latest per parameter
    const latestByParam = new Map<string, typeof snapshots[0]>();
    for (const s of snapshots) {
      if (!latestByParam.has(s.parameter)) {
        latestByParam.set(s.parameter, s);
      }
    }

    const parameters: QualityParameter[] = [];
    for (const [param, snapshot] of latestByParam) {
      if (!PARAMETER_LABELS[param]) continue;
      parameters.push({
        parameter: param,
        label: PARAMETER_LABELS[param],
        value: snapshot.value,
        unit: snapshot.unit,
        quality: assessQuality(param, snapshot.value),
        measurementDate: snapshot.measurementDate.toISOString(),
      });
    }

    // Also fetch biological indices
    const bioIndices = await prisma.biologicalIndex.findMany({
      where: { spotId: spot.id },
      orderBy: { measurementDate: 'desc' },
    });

    // Keep most recent per indexType
    const latestBio = new Map<string, typeof bioIndices[0]>();
    for (const idx of bioIndices) {
      if (!latestBio.has(idx.indexType)) {
        latestBio.set(idx.indexType, idx);
      }
    }

    const biologicalIndices = Array.from(latestBio.values()).map((idx) => ({
      indexType: idx.indexType,
      value: idx.value,
      qualityClass: idx.qualityClass,
      measurementDate: idx.measurementDate.toISOString(),
    }));

    return NextResponse.json({ data: parameters, biologicalIndices });
  } catch (error) {
    console.error('Water quality error:', error);
    return NextResponse.json({ error: 'Failed to fetch water quality' }, { status: 500 });
  }
}
