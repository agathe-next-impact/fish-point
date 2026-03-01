import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Date / time
// ---------------------------------------------------------------------------

/**
 * Format an ISO date string into a human-readable date.
 * Examples: "1 mars 2026", "Aujourd'hui", "Hier"
 */
export function formatDate(iso: string | Date): string {
  const date = typeof iso === 'string' ? parseISO(iso) : iso;
  if (isToday(date)) return "Aujourd'hui";
  if (isYesterday(date)) return 'Hier';
  return format(date, 'd MMMM yyyy', { locale: fr });
}

/**
 * Short date for compact UIs: "01/03/26"
 */
export function formatDateShort(iso: string | Date): string {
  const date = typeof iso === 'string' ? parseISO(iso) : iso;
  return format(date, 'dd/MM/yy', { locale: fr });
}

/**
 * Date + time: "1 mars 2026 a 14:32"
 */
export function formatDateTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? parseISO(iso) : iso;
  return format(date, "d MMMM yyyy 'a' HH:mm", { locale: fr });
}

/**
 * Relative time: "il y a 3 heures", "il y a 2 jours"
 */
export function formatRelativeTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? parseISO(iso) : iso;
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

/**
 * Time only: "14:32"
 */
export function formatTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? parseISO(iso) : iso;
  return format(date, 'HH:mm', { locale: fr });
}

/**
 * Month + year: "mars 2026"
 */
export function formatMonthYear(iso: string | Date): string {
  const date = typeof iso === 'string' ? parseISO(iso) : iso;
  return format(date, 'MMMM yyyy', { locale: fr });
}

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

/**
 * Format a distance in metres to a user-friendly string.
 *   - < 1 000 m  => "850 m"
 *   - >= 1 000 m  => "1,2 km"
 *   - >= 100 km   => "134 km"
 */
export function formatDistance(metres: number): string {
  if (metres < 1000) {
    return `${Math.round(metres)} m`;
  }
  if (metres < 100_000) {
    const km = metres / 1000;
    return `${km.toFixed(1).replace('.', ',')} km`;
  }
  return `${Math.round(metres / 1000)} km`;
}

/**
 * Very compact distance label for map pins: "850m" / "1.2km"
 */
export function formatDistanceCompact(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)}m`;
  return `${(metres / 1000).toFixed(1).replace('.', ',')}km`;
}

// ---------------------------------------------------------------------------
// Coordinates
// ---------------------------------------------------------------------------

/**
 * Format a coordinate pair as DMS (Degrees, Minutes, Seconds).
 *   "48°51'24.0"N  2°21'07.0"E"
 */
export function formatCoordsDMS(lat: number, lng: number): string {
  return `${decimalToDMS(lat, 'lat')}  ${decimalToDMS(lng, 'lng')}`;
}

/**
 * Format a coordinate pair as decimal degrees.
 *   "48.8567, 2.3508"
 */
export function formatCoordsDecimal(lat: number, lng: number, precision = 4): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

function decimalToDMS(decimal: number, axis: 'lat' | 'lng'): string {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesDecimal = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = ((minutesDecimal - minutes) * 60).toFixed(1);

  const direction =
    axis === 'lat' ? (decimal >= 0 ? 'N' : 'S') : decimal >= 0 ? 'E' : 'W';

  return `${degrees}\u00B0${String(minutes).padStart(2, '0')}'${String(seconds).padStart(4, '0')}"${direction}`;
}

// ---------------------------------------------------------------------------
// Fish measurements
// ---------------------------------------------------------------------------

/**
 * Format a weight in kilograms: "2,35 kg" or "850 g" for < 1 kg.
 */
export function formatWeight(kg: number): string {
  if (kg < 1) {
    return `${Math.round(kg * 1000)} g`;
  }
  return `${kg.toFixed(2).replace('.', ',')} kg`;
}

/**
 * Format a length in centimetres: "62 cm"
 */
export function formatLength(cm: number): string {
  return `${Math.round(cm)} cm`;
}

/**
 * Format a temperature: "18 °C"
 */
export function formatTemperature(celsius: number): string {
  return `${Math.round(celsius)} °C`;
}

/**
 * Format atmospheric pressure: "1013 hPa"
 */
export function formatPressure(hPa: number): string {
  return `${Math.round(hPa)} hPa`;
}

// ---------------------------------------------------------------------------
// Counts & numbers
// ---------------------------------------------------------------------------

/**
 * Format a number with French-style thousands separator (space).
 *   1234567 => "1 234 567"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR');
}

/**
 * Compact number: 1200 => "1,2k", 1500000 => "1,5M"
 */
export function formatCompactNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace('.', ',')}k`;
  }
  const m = n / 1_000_000;
  return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace('.', ',')}M`;
}

/**
 * Format a rating: "4,2" (French decimal) — or "—" if null.
 */
export function formatRating(rating: number | null): string {
  if (rating === null || rating === undefined) return '\u2014';
  return rating.toFixed(1).replace('.', ',');
}

/**
 * Pluralise a French word naively (works for regular nouns).
 *   pluralize(3, 'poisson') => "3 poissons"
 *   pluralize(1, 'prise')   => "1 prise"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count <= 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

// ---------------------------------------------------------------------------
// Domain labels
// ---------------------------------------------------------------------------

const WATER_TYPE_LABELS: Record<string, string> = {
  RIVER: 'Riviere',
  LAKE: 'Lac',
  POND: 'Etang',
  SEA: 'Mer',
  CANAL: 'Canal',
  RESERVOIR: 'Reservoir',
  STREAM: 'Ruisseau',
};

const FISHING_TYPE_LABELS: Record<string, string> = {
  SPINNING: 'Lancer',
  FLY: 'Mouche',
  COARSE: 'Coup',
  CARP: 'Carpe',
  SURFCASTING: 'Surfcasting',
  TROLLING: 'Traine',
  FLOAT_TUBE: 'Float tube',
  BOAT: 'Bateau',
  SHORE: 'Bord',
};

const ABUNDANCE_LABELS: Record<string, string> = {
  RARE: 'Rare',
  LOW: 'Faible',
  MODERATE: 'Moyen',
  HIGH: 'Abondant',
  VERY_HIGH: 'Tres abondant',
};

const WATER_CATEGORY_LABELS: Record<string, string> = {
  FIRST: '1ere categorie',
  SECOND: '2eme categorie',
};

/**
 * Get a human-readable label for an enum value.
 * Falls back to the raw value with basic formatting if not found.
 */
export function labelForWaterType(value: string): string {
  return WATER_TYPE_LABELS[value] ?? humanize(value);
}

export function labelForFishingType(value: string): string {
  return FISHING_TYPE_LABELS[value] ?? humanize(value);
}

export function labelForAbundance(value: string): string {
  return ABUNDANCE_LABELS[value] ?? humanize(value);
}

export function labelForWaterCategory(value: string): string {
  return WATER_CATEGORY_LABELS[value] ?? humanize(value);
}

/**
 * Convert a SCREAMING_SNAKE enum value to "Screaming snake".
 */
function humanize(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/**
 * Truncate a string to `maxLength` characters, appending "..." if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}\u2026`;
}

/**
 * Build an initial from a name: "Jean Dupont" => "JD", "alice" => "A"
 */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join('');
}
