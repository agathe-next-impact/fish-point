// Hub'Eau Poisson API types
export interface HubeauPoissonStation {
  code_station: string;
  libelle_station: string;
  uri_station?: string;
  localisation_precise_station?: string;
  longitude: number;
  latitude: number;
  code_departement: string;
  libelle_departement: string;
  code_commune: string;
  libelle_commune: string;
  code_entite_hydrographique?: string;
  libelle_entite_hydrographique?: string;
  altitude?: number;
  surface_bassin_versant_amont?: number;
}

export interface HubeauFishObservation {
  code_station: string;
  code_operation: string;
  date_operation: string;
  code_alternatif_taxon: string;
  nom_commun_taxon: string;
  nom_latin_taxon: string;
  effectif_lot: number;
  taille_individu_min?: number;
  taille_individu_max?: number;
}

export interface HubeauPaginatedResponse<T> {
  count: number;
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
  api_version: string;
  data: T[];
}

// Hub'Eau Qualité API types
export interface HubeauQualityStation {
  code_station: string;
  libelle_station: string;
  coordonnee_x: number;
  coordonnee_y: number;
  code_commune: string;
  libelle_commune: string;
}

export interface HubeauQualityMeasurement {
  code_station: string;
  code_parametre: string;
  libelle_parametre: string;
  resultat: number;
  symbole_unite: string;
  date_prelevement: string;
}

// Hub'Eau Temperature API types
export interface HubeauTempStation {
  code_station: string;
  libelle_station: string;
  coordonnee_x: number;
  coordonnee_y: number;
  code_departement: string;
}

export interface HubeauTempMeasurement {
  code_station: string;
  date_mesure_temp: string;
  resultat: number;
}

// Open-Meteo types
export interface OpenMeteoCurrentWeather {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  cloudCover: number;
  weatherCode: number;
  uvIndex: number;
  precipitationProbability: number;
  precipitation: number;
  soilTemperature: number;
  soilMoisture: number;
  directRadiation: number;
}

export interface OpenMeteoRawResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    surface_pressure: number;
    wind_speed_10m: number;
    cloud_cover: number;
    weather_code: number;
    uv_index: number;
    precipitation_probability: number;
    precipitation: number;
    soil_temperature_0_to_7cm: number;
    soil_moisture_0_to_7cm: number;
    direct_radiation: number;
  };
}

// Sandre types
export interface SandreWaterBody {
  CdEntiteHydr662: string;
  LbEntiteHydrographique: string;
  TypeEntiteHydro: string;
  CdDepartement?: string;
}

// Overpass API (OpenStreetMap) types
export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  version: number;
  elements: OverpassElement[];
}

// Ingestion result
export interface IngestionResult {
  spotsCreated: number;
  spotsUpdated: number;
  spotsSkipped: number;
  observationsAdded: number;
  errors: string[];
  duration: number;
}

// Score types
export interface SpotScore {
  spotId: string;
  fishabilityScore: number;
  staticScore: number;
  dynamicScore: number;
  factors: Array<{
    name: string;
    impact: 'positive' | 'neutral' | 'negative';
    description: string;
  }>;
  weather?: {
    temperature: number;
    pressure: number;
    windSpeed: number;
    cloudCover: number;
    uvIndex?: number;
    precipitation?: number;
    precipitationProbability?: number;
  };
  solunar?: {
    moonPhaseName: string;
    currentActivity: 'major' | 'minor' | 'none';
    periods: Array<{
      type: 'major' | 'minor';
      label: string;
      start: string;
      end: string;
    }>;
  };
  scoreUpdatedAt: string;
}
