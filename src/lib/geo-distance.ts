/**
 * Distance géodésique entre deux coordonnées WGS84, en MÈTRES.
 *
 * Formule de Haversine (sphère). Précision largement suffisante pour trier des
 * spots « autour de moi » (erreur < 0,5 % vs ellipsoïde aux distances usuelles).
 * Le résultat est en mètres pour s'aligner sur `formatDistance` (src/lib/map.ts),
 * qui attend des mètres et bascule en km au-delà de 1 000.
 *
 * Pure et sans dépendance : réutilisable côté serveur comme client, testable.
 */

const EARTH_RADIUS_M = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Coordonnée géographique minimale. */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Distance en mètres entre `from` et `to`.
 *
 * @throws RangeError si une coordonnée est non finie ou hors plage WGS84.
 */
export function haversineMeters(from: LatLng, to: LatLng): number {
  for (const { latitude, longitude } of [from, to]) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new RangeError('Coordonnées invalides : latitude/longitude doivent être finies.');
    }
    if (latitude < -90 || latitude > 90) {
      throw new RangeError(`Latitude hors plage [-90, 90] : ${latitude}`);
    }
    if (longitude < -180 || longitude > 180) {
      throw new RangeError(`Longitude hors plage [-180, 180] : ${longitude}`);
    }
  }

  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Trie une liste de points par distance croissante depuis `origin`, en
 * renseignant `distance` (mètres) sur une copie de chaque élément.
 *
 * Stable : à distance égale (ou sans origine), l'ordre d'entrée est conservé.
 * Si `origin` est `null`, renvoie une copie inchangée sans calculer de distance
 * (ex. géoloc indisponible / refusée).
 */
export function sortByDistance<T extends LatLng>(
  items: readonly T[],
  origin: LatLng | null,
): Array<T & { distance?: number }> {
  if (!origin) {
    return items.map((item) => ({ ...item }));
  }

  return items
    .map((item) => ({ ...item, distance: haversineMeters(origin, item) }))
    .sort((a, b) => a.distance - b.distance);
}
