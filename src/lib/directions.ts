/**
 * Construction de deep-links « Itinéraire » vers une coordonnée GPS.
 *
 * On cible l'URL universelle Google Maps Directions (`api=1`), qui fonctionne
 * aussi bien sur mobile (ouvre l'app native si installée) que sur desktop
 * (ouvre maps.google.com). Aucune clé requise, aucun appel réseau côté serveur.
 *
 * @see https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */

const GOOGLE_MAPS_DIRECTIONS_BASE = 'https://www.google.com/maps/dir/';

/**
 * Construit l'URL d'itinéraire vers `destination = lat,lng`.
 * La destination est laissée à Google (position courante de l'utilisateur).
 *
 * @throws RangeError si les coordonnées sont hors plage WGS84 ou non finies.
 */
export function buildDirectionsUrl(latitude: number, longitude: number): string {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new RangeError('Coordonnées invalides : latitude/longitude doivent être des nombres finis.');
  }
  if (latitude < -90 || latitude > 90) {
    throw new RangeError(`Latitude hors plage [-90, 90] : ${latitude}`);
  }
  if (longitude < -180 || longitude > 180) {
    throw new RangeError(`Longitude hors plage [-180, 180] : ${longitude}`);
  }

  const params = new URLSearchParams({
    api: '1',
    destination: `${latitude},${longitude}`,
  });

  return `${GOOGLE_MAPS_DIRECTIONS_BASE}?${params.toString()}`;
}
