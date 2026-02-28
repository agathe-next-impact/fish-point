export interface PollenInfo {
  alderPollen: number;
  birchPollen: number;
  grassPollen: number;
  totalPollen: number;
  pollenLevel: 'none' | 'low' | 'moderate' | 'high';
  uvIndex: number;
  europeanAqi: number | null;
  label: string;
  insectHatchLikely: boolean;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  pollen?: PollenInfo | null;
}

export interface WaterLevelData {
  stationCode: string;
  stationName: string;
  currentLevel: number;
  trend: 'rising' | 'stable' | 'falling';
  lastUpdate: string;
  unit: string;
  alertLevel: 'normal' | 'vigilance' | 'alert' | 'crisis' | null;
}

export interface MoonPhaseData {
  phase: string;
  illumination: number;
  emoji: string;
}

export interface SunTimesData {
  sunrise: string;
  sunset: string;
  dawn: string;
  dusk: string;
  goldenHourStart: string;
  goldenHourEnd: string;
}
