import { getCached } from '@/lib/redis';

const APICARTO_CADASTRE = 'https://apicarto.ign.fr/api/cadastre/parcelle';
const MAJIC_API = 'https://opendata.koumoul.com/data-fair/api/v1/datasets/parcelles-des-personnes-morales/lines';

export interface CadastreResult {
  isPublic: boolean;
  ownerType: 'public' | 'private' | 'unknown';
  ownerGroupCode: string | null;
  ownerName: string | null;
  codeParcelle: string | null;
}

// MAJIC groupe_personne codes:
// 1 = Etat, 2 = Region, 3 = Departement, 4 = Commune, 9 = Autres collectivites
// 5 = Office HLM, 6 = Personnes de droit privé, etc.
const PUBLIC_OWNER_GROUPS = ['1', '2', '3', '4', '9'];

/**
 * Check land ownership at coordinates using API Carto Cadastre + MAJIC.
 * Determines if the parcel is public or private land.
 *
 * Step 1: API Carto → get parcelle code
 * Step 2: MAJIC Koumoul → get owner type (groupe_personne)
 *
 * Cache: 30 days.
 */
export async function checkLandOwnership(
  lat: number,
  lon: number,
): Promise<CadastreResult> {
  const cacheKey = `cadastre:${lat.toFixed(4)}_${lon.toFixed(4)}`;

  return getCached(
    cacheKey,
    async () => {
      try {
        // Step 1: Get parcelle from API Carto
        const geom = JSON.stringify({
          type: 'Point',
          coordinates: [lon, lat],
        });

        const cadastreUrl = `${APICARTO_CADASTRE}?geom=${encodeURIComponent(geom)}`;
        const cadastreRes = await fetch(cadastreUrl, {
          signal: AbortSignal.timeout(10000),
        });

        if (!cadastreRes.ok) {
          return { isPublic: false, ownerType: 'unknown', ownerGroupCode: null, ownerName: null, codeParcelle: null };
        }

        const cadastreBody = await cadastreRes.json();
        const parcelle = cadastreBody.features?.[0];
        if (!parcelle?.properties) {
          return { isPublic: false, ownerType: 'unknown', ownerGroupCode: null, ownerName: null, codeParcelle: null };
        }

        const codeParcelle = String(
          parcelle.properties.code_dep || '',
        ) + String(
          parcelle.properties.code_com || '',
        ) + String(
          parcelle.properties.com_abs || '000',
        ) + String(
          parcelle.properties.section || '',
        ) + String(
          parcelle.properties.numero || '',
        );

        // Step 2: Check MAJIC for owner type
        const majicRes = await fetch(
          `${MAJIC_API}?code_parcelle=${encodeURIComponent(codeParcelle)}&size=1`,
          { signal: AbortSignal.timeout(10000) },
        );

        if (!majicRes.ok) {
          return { isPublic: false, ownerType: 'unknown', ownerGroupCode: null, ownerName: null, codeParcelle };
        }

        const majicBody = await majicRes.json();
        const owner = majicBody.results?.[0];

        if (!owner) {
          // No owner in MAJIC = likely private individual (not in personne morale DB)
          return { isPublic: false, ownerType: 'private', ownerGroupCode: null, ownerName: null, codeParcelle };
        }

        const groupCode = String(owner.groupe_personne ?? '');
        const isPublic = PUBLIC_OWNER_GROUPS.includes(groupCode);

        return {
          isPublic,
          ownerType: isPublic ? 'public' : 'private',
          ownerGroupCode: groupCode || null,
          ownerName: String(owner.denomination ?? '') || null,
          codeParcelle,
        };
      } catch {
        return { isPublic: false, ownerType: 'unknown', ownerGroupCode: null, ownerName: null, codeParcelle: null };
      }
    },
    2592000, // 30 days
  );
}
