const WMS_BASE = 'https://data.geopf.fr/wms-r/ows';

/**
 * Generate an IGN orthophoto URL (WMS GetMap) centered on coordinates.
 * Returns a direct URL to a JPEG aerial image (~500m radius).
 * No API key required — free public service.
 */
export function getOrthoPhotoUrl(
  lat: number,
  lon: number,
  widthPx = 800,
  heightPx = 600,
): string {
  // ~500m bounding box adjusted for latitude
  const deltaLat = 0.0045;
  const deltaLon = 0.0065 / Math.cos((lat * Math.PI) / 180) * Math.cos((46 * Math.PI) / 180);

  // WMS 1.3.0 with CRS EPSG:4326 uses axis order lat,lon
  const bbox = [
    (lat - deltaLat).toFixed(6),
    (lon - deltaLon).toFixed(6),
    (lat + deltaLat).toFixed(6),
    (lon + deltaLon).toFixed(6),
  ].join(',');

  const params = new URLSearchParams({
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: '1.3.0',
    LAYERS: 'ORTHOIMAGERY.ORTHOPHOTOS',
    CRS: 'EPSG:4326',
    BBOX: bbox,
    WIDTH: widthPx.toString(),
    HEIGHT: heightPx.toString(),
    FORMAT: 'image/jpeg',
    STYLES: '',
  });

  return `${WMS_BASE}?${params.toString()}`;
}
