import type { WaterLevelData } from '@/types/weather';

const HUBEAU_BASE_URL = process.env.HUBEAU_BASE_URL || 'https://hubeau.eaufrance.fr/api';

export async function fetchWaterLevelByStation(
  stationCode: string,
): Promise<WaterLevelData | null> {
  try {
    const res = await fetch(
      `${HUBEAU_BASE_URL}/v1/hydrometrie/observations_tr?code_entite=${stationCode}&size=2&sort=desc&fields=date_obs,resultat_obs`,
    );

    if (!res.ok) return null;
    const data = await res.json();

    if (!data.data || data.data.length === 0) return null;

    const latest = data.data[0];
    const previous = data.data[1];

    let trend: 'rising' | 'stable' | 'falling' = 'stable';
    if (previous) {
      const diff = latest.resultat_obs - previous.resultat_obs;
      if (diff > 0.05) trend = 'rising';
      else if (diff < -0.05) trend = 'falling';
    }

    return {
      stationCode,
      stationName: '',
      currentLevel: latest.resultat_obs,
      trend,
      lastUpdate: latest.date_obs,
      unit: 'm',
      alertLevel: null,
    };
  } catch {
    return null;
  }
}

export async function findNearestStation(
  lat: number,
  lon: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${HUBEAU_BASE_URL}/v1/hydrometrie/referentiel/stations?latitude=${lat}&longitude=${lon}&distance=20&size=1&fields=code_station`,
    );

    if (!res.ok) return null;
    const data = await res.json();

    return data.data?.[0]?.code_station || null;
  } catch {
    return null;
  }
}
