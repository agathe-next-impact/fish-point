import SunCalc from 'suncalc';

export interface SolunarPeriod {
  type: 'major' | 'minor';
  label: string;
  start: Date;
  end: Date;
}

export interface SolunarData {
  periods: SolunarPeriod[];
  moonPhase: number;
  moonPhaseName: string;
  moonRise: Date | null;
  moonSet: Date | null;
  /** Current solunar activity: 'major' | 'minor' | 'none' */
  currentActivity: 'major' | 'minor' | 'none';
  /** Score impact based on current period */
  scoreImpact: number;
}

/**
 * Calculate the moon transit time (when the moon is at its highest point).
 * This is approximated as the midpoint between moon rise and set,
 * or by finding the hour with maximum altitude.
 */
function findMoonTransit(date: Date, lat: number, lon: number): Date | null {
  let maxAlt = -Infinity;
  let transitHour = 12;

  // Scan each hour to find peak altitude
  for (let h = 0; h < 24; h++) {
    const checkTime = new Date(date);
    checkTime.setHours(h, 0, 0, 0);
    const pos = SunCalc.getMoonPosition(checkTime, lat, lon);
    if (pos.altitude > maxAlt) {
      maxAlt = pos.altitude;
      transitHour = h;
    }
  }

  // Refine to 15-min precision
  let refinedMinute = 0;
  maxAlt = -Infinity;
  for (let m = 0; m < 60; m += 15) {
    const checkTime = new Date(date);
    checkTime.setHours(transitHour, m, 0, 0);
    const pos = SunCalc.getMoonPosition(checkTime, lat, lon);
    if (pos.altitude > maxAlt) {
      maxAlt = pos.altitude;
      refinedMinute = m;
    }
  }

  const transit = new Date(date);
  transit.setHours(transitHour, refinedMinute, 0, 0);
  return transit;
}

/**
 * Get moon phase name from illumination phase value (0-1).
 */
function getMoonPhaseName(phase: number): string {
  if (phase < 0.05 || phase > 0.95) return 'Nouvelle lune';
  if (phase < 0.2) return 'Premier croissant';
  if (phase < 0.3) return 'Premier quartier';
  if (phase < 0.45) return 'Gibbeuse croissante';
  if (phase < 0.55) return 'Pleine lune';
  if (phase < 0.7) return 'Gibbeuse décroissante';
  if (phase < 0.8) return 'Dernier quartier';
  return 'Dernier croissant';
}

/**
 * Compute solunar periods for a given date and location.
 * Major periods: moon transit ±1h, opposite transit ±1h
 * Minor periods: moon rise ±30min, moon set ±30min
 */
export function computeSolunarData(
  date: Date,
  lat: number,
  lon: number,
): SolunarData {
  const moonTimes = SunCalc.getMoonTimes(date, lat, lon);
  const moonIllum = SunCalc.getMoonIllumination(date);

  const periods: SolunarPeriod[] = [];

  // Moon transit (major period ±1h)
  const transit = findMoonTransit(date, lat, lon);
  if (transit) {
    periods.push({
      type: 'major',
      label: 'Transit lunaire',
      start: new Date(transit.getTime() - 60 * 60 * 1000),
      end: new Date(transit.getTime() + 60 * 60 * 1000),
    });

    // Opposite transit (12h offset, major period ±1h)
    const oppositeTransit = new Date(transit.getTime() + 12 * 60 * 60 * 1000);
    if (oppositeTransit.getDate() === date.getDate() || oppositeTransit.getDate() === date.getDate() + 1) {
      periods.push({
        type: 'major',
        label: 'Transit opposé',
        start: new Date(oppositeTransit.getTime() - 60 * 60 * 1000),
        end: new Date(oppositeTransit.getTime() + 60 * 60 * 1000),
      });
    }
  }

  // Moon rise (minor period ±30min)
  const moonRise = moonTimes.rise ?? null;
  if (moonRise) {
    periods.push({
      type: 'minor',
      label: 'Lever de lune',
      start: new Date(moonRise.getTime() - 30 * 60 * 1000),
      end: new Date(moonRise.getTime() + 30 * 60 * 1000),
    });
  }

  // Moon set (minor period ±30min)
  const moonSet = moonTimes.set ?? null;
  if (moonSet) {
    periods.push({
      type: 'minor',
      label: 'Coucher de lune',
      start: new Date(moonSet.getTime() - 30 * 60 * 1000),
      end: new Date(moonSet.getTime() + 30 * 60 * 1000),
    });
  }

  // Sort by start time
  periods.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Determine current activity
  const now = date;
  let currentActivity: 'major' | 'minor' | 'none' = 'none';
  for (const period of periods) {
    if (now >= period.start && now <= period.end) {
      if (period.type === 'major') {
        currentActivity = 'major';
        break;
      }
      currentActivity = 'minor';
    }
  }

  const scoreImpact = currentActivity === 'major' ? 12 : currentActivity === 'minor' ? 6 : 0;

  return {
    periods,
    moonPhase: moonIllum.phase,
    moonPhaseName: getMoonPhaseName(moonIllum.phase),
    moonRise,
    moonSet,
    currentActivity,
    scoreImpact,
  };
}
