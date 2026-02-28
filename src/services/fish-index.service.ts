import type { FishActivityIndex, FishActivityFactor } from '@/types/fish';

export interface FishIndexInput {
  pressure: number;
  pressureTrend: 'rising' | 'stable' | 'falling';
  temperature: number;
  waterTemperature?: number;
  waterLevelTrend?: 'rising' | 'stable' | 'falling';
  windSpeed: number;
  cloudCover: number;
  moonPhase: string;
  hourOfDay: number;
  month: number;
}

export function calculateFishActivityIndex(input: FishIndexInput): FishActivityIndex {
  let score = 50;
  const factors: FishActivityFactor[] = [];

  // Pression atmosphérique
  if (input.pressureTrend === 'falling') {
    score += 15;
    factors.push({ name: 'Pression', impact: 'positive', description: 'Pression en baisse - haute activité' });
  } else if (input.pressureTrend === 'stable') {
    score += 5;
    factors.push({ name: 'Pression', impact: 'neutral', description: 'Pression stable' });
  } else {
    factors.push({ name: 'Pression', impact: 'negative', description: 'Pression en hausse - activité réduite' });
  }

  if (input.pressure >= 1010 && input.pressure <= 1020) {
    score += 10;
  }

  // Vent
  if (input.windSpeed >= 5 && input.windSpeed <= 20) {
    score += 10;
    factors.push({ name: 'Vent', impact: 'positive', description: 'Vent léger favorable' });
  } else if (input.windSpeed > 40) {
    score -= 20;
    factors.push({ name: 'Vent', impact: 'negative', description: 'Vent trop fort' });
  } else {
    factors.push({ name: 'Vent', impact: 'neutral', description: 'Conditions de vent neutres' });
  }

  // Couverture nuageuse
  if (input.cloudCover >= 50 && input.cloudCover <= 80) {
    score += 10;
    factors.push({ name: 'Nuages', impact: 'positive', description: 'Ciel couvert favorable' });
  } else {
    factors.push({ name: 'Nuages', impact: 'neutral', description: 'Couverture nuageuse neutre' });
  }

  // Phase lunaire
  if (['new', 'full'].includes(input.moonPhase)) {
    score += 10;
    factors.push({ name: 'Lune', impact: 'positive', description: 'Phase lunaire favorable' });
  } else {
    factors.push({ name: 'Lune', impact: 'neutral', description: 'Phase lunaire neutre' });
  }

  // Heure
  if (
    (input.hourOfDay >= 5 && input.hourOfDay <= 9) ||
    (input.hourOfDay >= 17 && input.hourOfDay <= 21)
  ) {
    score += 15;
    factors.push({ name: 'Heure', impact: 'positive', description: 'Créneau horaire optimal' });
  } else if (input.hourOfDay >= 11 && input.hourOfDay <= 14) {
    score -= 10;
    factors.push({ name: 'Heure', impact: 'negative', description: 'Créneau horaire défavorable' });
  } else {
    factors.push({ name: 'Heure', impact: 'neutral', description: 'Créneau horaire neutre' });
  }

  // Température eau
  if (input.waterTemperature !== undefined) {
    if (input.waterTemperature >= 12 && input.waterTemperature <= 20) {
      score += 10;
      factors.push({ name: 'Eau', impact: 'positive', description: 'Température eau idéale' });
    } else if (input.waterTemperature < 5 || input.waterTemperature > 25) {
      score -= 15;
      factors.push({ name: 'Eau', impact: 'negative', description: 'Température eau extrême' });
    } else {
      factors.push({ name: 'Eau', impact: 'neutral', description: 'Température eau acceptable' });
    }
  }

  // Tendance niveau d'eau
  if (input.waterLevelTrend) {
    if (input.waterLevelTrend === 'stable') {
      score += 10;
      factors.push({ name: 'Niveau eau', impact: 'positive', description: 'Niveau d\'eau stable - favorable' });
    } else if (input.waterLevelTrend === 'rising') {
      score += 5;
      factors.push({ name: 'Niveau eau', impact: 'neutral', description: 'Niveau d\'eau en hausse' });
    } else {
      score -= 5;
      factors.push({ name: 'Niveau eau', impact: 'negative', description: 'Niveau d\'eau en baisse' });
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label: getScoreLabel(score),
    color: getScoreColor(score),
    factors,
  };
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellente';
  if (score >= 60) return 'Bonne';
  if (score >= 40) return 'Moyenne';
  if (score >= 20) return 'Faible';
  return 'Très faible';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}
