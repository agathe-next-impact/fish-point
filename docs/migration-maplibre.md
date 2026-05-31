# Migration Mapbox → MapLibre + Protomaps

## Objectif

Remplacer la dépendance commerciale Mapbox GL JS (licence propriétaire, token obligatoire, ~580 KB gzippé) par la stack open-source MapLibre GL JS + tuiles PMTiles auto-hébergées sur R2, pour le web (Next.js App Router) et le mobile (Expo React Native). Le périmètre est la France métropolitaine uniquement.

## Non-objectifs

- Pas de migration DOM-TOM, pas de couverture planétaire.
- Pas de refonte du design de la carte (thème Protomaps au plus proche du style actuel `outdoors`).
- Pas de remplacement du service météo, hydrologie ou autres APIs tierces.
- Pas de modification du schéma Prisma ni des endpoints API existants.
- Pas de mise à jour du plan Stripe ou des abonnements premium.

---

## Index des tickets

| ID | Lot | Titre | Estimation | Dépend de | Statut |
|----|-----|-------|-----------|-----------|--------|
| ML-00 | Epic | [Epic] Migration Mapbox → MapLibre + Protomaps | — | — | en cours |
| ML-01 | Lot 0 | [Infra] PMTiles France hébergées sur Vercel Blob | 0,5 j | — | ✅ |
| ML-02 | Lot 1 | [Web] Installer MapLibre + pmtiles, retirer Mapbox, feature flag provider | 0,5 j | ML-01 | ✅ |
| ML-03 | Lot 1 | [Web] Swapper les imports react-map-gl dans les composants map et les pages my-spots | 0,5 j | ML-02 | ✅ |
| ML-04 | Lot 1 | [Web] Adapter MapControls, ServiceWorker et next.config (fin du swap iso-fonctionnel) | 0,5 j | ML-03 | ✅ |
| ML-05 | Lot 2 | [Web] Réécrire geocoding.service.ts sur BAN (api-adresse.data.gouv.fr) | 0,5 j | ML-02 | ✅ |
| ML-06 | Lot 3 | [Web] Customiser le thème Protomaps et brancher la couche satellite IGN WMTS | 1-2 j | ML-04 | partiel (satellite + labels overlay branchés, polish visuel à valider en browser) |
| ML-07 | Lot 4 | [Web] Mesure bundle + Lighthouse, nettoyage token Mapbox, MAJ docs | 0,5 j | ML-06, ML-05 | partiel (CLAUDE.md à jour, mesure bundle à faire) |
| ML-08 | Lot 5 | [Mobile] Migrer @rnmapbox/maps → @maplibre/maplibre-react-native dans mobile/ | 2-3 j | ML-01 | à démarrer |

### Chemin critique

```
ML-01 (infra R2)
  └─> ML-02 (install deps + flag)
        └─> ML-03 (swap composants)
              └─> ML-04 (controls + SW + next.config)  ← gate : E2E vert
                    └─> ML-06 (style + satellite)
                          └─> ML-07 (mesure + nettoyage)
```

### Lots parallélisables

- **ML-05** (géocodage BAN) : peut démarrer dès ML-02 mergé (indépendant des composants visuels).
- **ML-08** (mobile) : peut démarrer dès ML-01 mergé (les PMTiles R2 sont la seule dépendance partagée).
- **ML-06** (style) : peut démarrer en parallèle de ML-05.

---

## Détail des tickets

---

## ML-00 — [Epic] Migration Mapbox → MapLibre + Protomaps

**Contexte**
Chapeau de la migration. Regroupe les 6 lots (Lot 0 → Lot 5). L'epic est terminé quand ML-07 et ML-08 sont mergés et déployés en prod, et quand le token Mapbox a été supprimé des variables Vercel.

**Acceptance criteria**
- Given : l'application web est déployée sur Vercel
- When : un visiteur ouvre `/map`
- Then : la carte se charge avec les tuiles PMTiles depuis R2 (aucune requête vers `api.mapbox.com` ou `tiles.mapbox.com` dans le network panel)
- And : les variables `NEXT_PUBLIC_MAPBOX_TOKEN` et `MAPBOX_SECRET_TOKEN` ne sont plus présentes dans les envs Vercel

- Given : l'app mobile Expo est buildée
- When : un utilisateur ouvre l'écran carte
- Then : la carte s'affiche avec MapLibre RN et les mêmes tuiles R2

**Labels** : `migration`, `maps`, `web`, `mobile`, `infra`

---

## ML-01 — [Infra] Héberger les PMTiles France sur Vercel Blob

**Contexte**
Les tuiles vecteur auto-hébergées sont le prérequis bloquant pour tous les lots suivants. Hébergement sur **Vercel Blob** (pas R2) pour garder un seul vendeur. R2 reste réservé aux images existantes (migration future trackée dans `docs/tech-debt.md`).

**Acceptance criteria**
- Given : le store Blob est créé dans Vercel et `BLOB_READ_WRITE_TOKEN` est en env
- When : `npm run upload-tiles` est lancé avec `./tiles/western-europe.pmtiles`
- Then : le script termine sans erreur et imprime l'URL publique générée

- Given : la variable `NEXT_PUBLIC_PMTILES_URL` est renseignée
- When : `curl -I --range 0-1000 "$NEXT_PUBLIC_PMTILES_URL/western-europe.pmtiles"`
- Then : la réponse retourne `206 Partial Content` avec `Accept-Ranges: bytes` et `Cache-Control: public, max-age=31536000, immutable`

- Given : la commande curl avec `Origin: http://localhost:3000`
- Then : la réponse contient `Access-Control-Allow-Origin: *` (Vercel Blob gère le CORS par défaut)

- Given : on déclenche manuellement le workflow `update-tiles.yml`
- When : le job tourne
- Then : un nouveau `western-europe.pmtiles` extrait du planet du jour est poussé sur Blob

**Tasks**
- [ ] Créer un store Vercel Blob via dashboard Vercel → Storage (nom suggéré : `fishspot-tiles`)
- [ ] `vercel env pull .env.local` pour récupérer `BLOB_READ_WRITE_TOKEN`
- [ ] `npm install @vercel/blob`
- [ ] Extraire l'Europe de l'Ouest depuis le planet PMTiles quotidien via CLI `pmtiles extract` (Docker ou binaire natif). Commande dans `docs/ops/pmtiles-vercel-blob-setup.md` §4. Résultat : `./tiles/western-europe.pmtiles`. Alternative zéro-install : déclencher `gh workflow run update-tiles.yml` qui fait extract + upload en une étape.
- [ ] `npm run upload-tiles` — uploade via `scripts/upload-pmtiles.ts` avec `Cache-Control` immutable 1 an
- [ ] Définir `NEXT_PUBLIC_PMTILES_URL` (base URL retournée par Blob, sans `/western-europe.pmtiles`) en local + sur Vercel (Preview + Production)
- [ ] Mobile suspendu en mode PWA-only : conserver uniquement `NEXT_PUBLIC_PMTILES_URL` côté web/PWA
- [ ] Ajouter le secret GitHub `BLOB_READ_WRITE_TOKEN` pour activer le workflow mensuel `.github/workflows/update-tiles.yml`
- [ ] Vérifier les 3 curl du runbook (§7 de `docs/ops/pmtiles-vercel-blob-setup.md`)

**Tech**
- Lib : `@vercel/blob` (`put`, `head`)
- Script d'upload : `scripts/upload-pmtiles.ts` (déjà créé, déclenché via `npm run upload-tiles`)
- Workflow CI : `.github/workflows/update-tiles.yml` (cron mensuel + manuel, utilise `protomaps/go-pmtiles` pour extraire France depuis le planet quotidien)
- Vars Zod ajoutées dans `src/lib/env.ts` : `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_PMTILES_URL`
- Runbook complet : `docs/ops/pmtiles-vercel-blob-setup.md`

**Hors scope**
- Migration des images R2 → Blob (trackée dans `docs/tech-debt.md` → Medium)
- DOM-TOM, couverture planétaire

**Effort** : 0,5 jour
**Dépendances** : aucune
**Labels** : `infra`, `maps`

---

## ML-02 — [Web] Installer MapLibre + pmtiles, retirer Mapbox, feature flag provider

**Contexte**
Première étape du swap technique web. On installe les nouvelles dépendances, on retire les anciennes, et on pose le feature flag d'env qui permettra un rollback rapide en prod.

**Acceptance criteria**
- Given : `NEXT_PUBLIC_MAP_PROVIDER=mapbox` est défini dans l'env
- When : l'app démarre
- Then : le comportement actuel est conservé (aucune régression visible)

- Given : `NEXT_PUBLIC_MAP_PROVIDER=maplibre` est défini dans l'env
- When : l'app démarre
- Then : `mapbox-gl` n'est pas chargé dans le bundle (`npm run analyze` confirme l'absence de `mapbox-gl`)

- Given : un développeur installe les dépendances depuis zéro
- When : `npm install`
- Then : `mapbox-gl` et `@types/mapbox-gl` ne sont pas dans `node_modules` (retirés de `package.json`)

**Tasks**
- [ ] `npm install maplibre-gl pmtiles protomaps-themes-base`
- [ ] `npm remove mapbox-gl @types/mapbox-gl`
- [ ] Renommer `src/lib/mapbox.ts` → `src/lib/map.ts`
  - Retirer `MAPBOX_TOKEN` et le remplacement par une référence conditionnelle (voir ML-03)
  - Conserver `DEFAULT_CENTER`, `FRANCE_BOUNDS`, `formatDistance`, `calculateBounds` tels quels (pas de Mapbox API dans ces fonctions)
  - Remplacer `MAP_STYLES` (qui référence `mapbox://styles/...`) par un objet `MAP_STYLES` MapLibre : style vecteur via URL PMTiles + thème Protomaps, style satellite via URL WMTS IGN
- [ ] Ajouter `NEXT_PUBLIC_MAP_PROVIDER` dans `src/lib/env.ts` (Zod : `z.enum(['mapbox', 'maplibre']).default('maplibre')`)
- [ ] Ajouter `NEXT_PUBLIC_PMTILES_URL` dans `src/lib/env.ts` (Zod : `z.string().url()`)
- [ ] Mettre à jour `.env.example` (si existant) ou le créer avec ces deux variables
- [ ] Vérifier `npx tsc --noEmit` — aucune erreur de type introduite

**Tech**
- Fichiers impactés : `package.json`, `src/lib/map.ts` (nouveau nom), `src/lib/env.ts`
- `react-map-gl` reste à la version `^8.1.0` — le package supporte à la fois Mapbox et MapLibre via des sous-imports distincts (`react-map-gl/mapbox` vs `react-map-gl/maplibre`)
- Le feature flag est lu via `src/lib/env.ts`, pas via `process.env` direct dans les composants

**Hors scope**
- Swap des imports dans les composants (ML-03)
- Suppression effective du token Mapbox des envs Vercel (ML-07)

**Effort** : 0,5 jour
**Dépendances** : ML-01
**Labels** : `migration`, `maps`, `web`

---

## ML-03 — [Web] Swapper les imports react-map-gl dans les composants map et les pages my-spots

**Contexte**
Swap mécanique des 15 imports `react-map-gl/mapbox` → `react-map-gl/maplibre`. C'est le coeur du lot 1 : après ce ticket, tous les composants map et les deux pages my-spots utilisent MapLibre sous le capot.

**Acceptance criteria**
- Given : `NEXT_PUBLIC_MAP_PROVIDER=maplibre`
- When : on charge `/map`
- Then : la carte s'affiche (pas d'écran blanc), les spots sont visibles, les clusters fonctionnent, le popup s'ouvre au clic

- Given : on charge `/my-spots/new`
- When : on clique sur la carte
- Then : un marqueur draggable apparaît à la position cliquée

- Given : on charge `/my-spots/[id]`
- When : la page s'affiche
- Then : la mini-carte affiche le marqueur du spot à la bonne position

- Given : `npx tsc --noEmit`
- Then : aucune erreur de type (le type `MapboxEvent` dans `MapContainer.tsx:l.70` doit être remplacé par l'équivalent MapLibre)

**Tasks**

Fichiers à modifier — swap d'import `react-map-gl/mapbox` → `react-map-gl/maplibre` :
- [ ] `src/components/map/MapContainer.tsx`
  - Retirer `import type mapboxgl from 'mapbox-gl'` (l. 17)
  - Remplacer `mapboxgl.MapboxEvent` par `maplibregl.MapLibreEvent` (ou le type équivalent de react-map-gl v8)
  - Retirer `import 'mapbox-gl/dist/mapbox-gl.css'` → remplacer par `import 'maplibre-gl/dist/maplibre-gl.css'`
  - Retirer la prop `mapboxAccessToken` du composant `<Map>` → utiliser `mapLib` prop ou la config MapLibre
  - Enregistrer le protocole pmtiles au mount : `addProtocol('pmtiles', new Protocol().tile)` dans un `useEffect` ou directement dans le module
  - Passer `mapStyle` comme URL PMTiles : `pmtiles://${env.NEXT_PUBLIC_PMTILES_URL}/western-europe.pmtiles` + style Protomaps
- [x] `src/components/map/SpotLayer.tsx` — rendu natif MapLibre des spots publics
- [x] `src/components/map/SpotCluster.tsx` / `SpotMarker.tsx` — remplacés par des layers natifs
  - Swap import (l. 1)
  - Mettre à jour l'import de `formatDistance` : `@/lib/mapbox` → `@/lib/map`
- [ ] `src/components/map/HeatmapLayer.tsx` — swap import (l. 3)
- [ ] `src/components/map/FishabilityLayer.tsx` — swap import (l. 3)
- [ ] `src/components/map/RegulationZones.tsx` — swap import (l. 3)
- [ ] `src/components/map/RouteLayer.tsx` — swap import (l. 3)
- [ ] `src/components/map/UserLocation.tsx` — swap import (l. 3)
- [ ] `src/components/private-spots/PrivateSpotMarker.tsx` — swap import (l. 3)
- [ ] `src/app/(main)/my-spots/new/page.tsx`
  - Swap import react-map-gl (l. 5)
  - Mettre à jour l'import lib : `@/lib/mapbox` → `@/lib/map` (l. 10)
  - Retirer `import 'mapbox-gl/dist/mapbox-gl.css'` → `import 'maplibre-gl/dist/maplibre-gl.css'`
- [ ] `src/app/(main)/my-spots/[id]/page.tsx`
  - Swap import react-map-gl (l. 6)
  - Mettre à jour l'import lib : `@/lib/mapbox` → `@/lib/map` (l. 14)
  - Retirer `import 'mapbox-gl/dist/mapbox-gl.css'` → `import 'maplibre-gl/dist/maplibre-gl.css'`
- [ ] Vérifier les imports restants de `@/lib/mapbox` dans tout le repo (`grep -r "lib/mapbox" src/`) et les migrer vers `@/lib/map`

**Tech**
- `MapControls.tsx` référence aussi `MAP_STYLES` depuis `@/lib/mapbox` (l. 6) — inclure dans ce sweep
- `react-map-gl` v8 avec MapLibre : la prop `mapboxAccessToken` doit être supprimée (elle n'est pas acceptée par le renderer MapLibre). La configuration du style se fait via la prop `mapStyle` avec une URL compatible MapLibre (style JSON ou `pmtiles://...`)
- Point d'attention : `MapboxEvent` dans `MapContainer.tsx` ligne 70 — utiliser `MapLibreEvent<MouseEvent>` ou l'alias `MapEvent` de react-map-gl v8

**Hors scope**
- Adaptation du toggle satellite dans `MapControls.tsx` (ML-04)
- Style visuel Protomaps (ML-06)
- `OfflineMap.tsx` et `MapFilters.tsx` — pas d'import react-map-gl dans ces deux fichiers (confirmé)

**Effort** : 0,5 jour
**Dépendances** : ML-02
**Labels** : `migration`, `maps`, `web`

---

## ML-04 — [Web] Adapter MapControls, ServiceWorker et next.config (fin du swap iso-fonctionnel)

**Contexte**
Finalise le lot 1. Après ce ticket, le swap technique est complet et iso-fonctionnel. Le test E2E `map-navigation.spec.ts` doit rester vert. C'est la gate de merge avant les lots parallèles.

**Acceptance criteria**
- Given : `NEXT_PUBLIC_MAP_PROVIDER=maplibre`
- When : on clique sur le bouton de changement de style dans `MapControls`
- Then : la carte bascule entre le style vecteur (Protomaps base) et le style raster (WMTS IGN — `data.geopf.fr`)
- And : aucune requête vers `*.mapbox.com` n'apparaît dans le network panel

- Given : le ServiceWorker est actif
- When : une requête de tuile PMTiles arrive (hostname = `*.r2.dev` ou domaine R2 custom)
- Then : la règle Cache First du SW intercepte et met en cache la réponse (même comportement qu'avant avec les tuiles Mapbox)

- Given : `npx playwright test tests/e2e/map-navigation.spec.ts`
- Then : les deux tests passent sans modification du spec

- Given : `next build`
- Then : build sans erreur, aucune warning liée à `mapbox-gl` ou `@types/mapbox-gl`

**Tasks**
- [ ] `src/components/map/MapControls.tsx`
  - Retirer la référence à `MAP_STYLES.satellite` (style `mapbox://`) — remplacer par l'URL du style MapLibre satellite (couche WMTS IGN définie en ML-06, ici juste brancher la valeur de la constante `MAP_STYLES.satellite` mise à jour dans `src/lib/map.ts`)
  - La logique de toggle (comparaison `mapStyle === MAP_STYLES.outdoors`) reste identique, seules les valeurs des constantes changent
  - Mettre à jour l'import : `@/lib/mapbox` → `@/lib/map`
- [ ] `public/sw.js` ligne 55
  - Remplacer la condition `url.hostname.includes('mapbox')` par la condition correspondant au hostname R2 de `NEXT_PUBLIC_PMTILES_URL`
  - Comme `sw.js` n'a pas accès aux variables d'env, hardcoder le hostname R2 (ex : `url.hostname.includes('r2.dev') || url.hostname.includes('<bucket>.r2.cloudflarestorage.com')`) ou injecter la valeur au build via `next.config.mjs` (rewrites ou injection de constante dans le SW)
  - Garder la même logique Cache First + `trimCache(TILES_CACHE, MAX_TILES_ENTRIES)`
- [ ] `next.config.mjs`
  - Retirer le pattern `remotePatterns` `**.mapbox.com` (images)
  - Ajouter le hostname R2 public si des images statiques transitent par R2 (a priori non nécessaire ici — les tuiles ne passent pas par `next/image`)
  - Vérifier que `data.geopf.fr` est déjà dans `remotePatterns` (oui, confirmé ligne 27 du fichier actuel)
- [ ] Lancer `npx playwright test tests/e2e/map-navigation.spec.ts` — doit rester vert

**Tech**
- Fichiers impactés : `src/components/map/MapControls.tsx`, `public/sw.js`, `next.config.mjs`
- L'injection de la variable d'env dans le SW peut se faire via un `<script>` inline dans `_document` ou via un rewrite next.js qui sert un SW dynamique — à trancher au moment de l'implémentation. Alternative simple : stocker le hostname en constante dans `sw.js` puisque le bucket R2 est stable.
- Risque : si le hostname R2 change (migration vers domaine custom), la règle SW doit être mise à jour manuellement

**Hors scope**
- Customisation visuelle du thème Protomaps (ML-06)
- Suppression du token Mapbox de Vercel (ML-07)

**Effort** : 0,5 jour
**Dépendances** : ML-03
**Labels** : `migration`, `maps`, `web`

---

## ML-05 — [Web] Réécrire geocoding.service.ts sur BAN (api-adresse.data.gouv.fr)

**Contexte**
`src/services/geocoding.service.ts` appelle l'API Mapbox Places avec `MAPBOX_SECRET_TOKEN`. Ce ticket remplace ces appels par l'API BAN, souveraine, gratuite et sans clé. Le mapping de réponse est différent de Mapbox Places.

**Acceptance criteria**
- Given : `geocode('Paris')` est appelé
- When : la fonction retourne
- Then : le résultat contient au moins un `GeocodingResult` avec `commune: 'Paris'`, `departmentCode: '75'`, `latitude` et `longitude` correctes

- Given : `reverseGeocode(48.8566, 2.3522)` est appelé
- When : la fonction retourne
- Then : le résultat contient `commune: 'Paris'`, `departmentCode: '75'` et `region` non null

- Given : le test Vitest `tests/unit/services/geocoding.test.ts` est lancé
- Then : tous les cas passent (mock de `fetch` sur l'URL BAN)

- Given : `MAPBOX_SECRET_TOKEN` n'est pas défini dans `.env`
- When : `geocode()` ou `reverseGeocode()` est appelé
- Then : la fonction retourne un résultat (pas de retour précoce `[]` ou `null` — la BAN ne nécessite pas de clé)

**Tasks**
- [ ] Réécrire `src/services/geocoding.service.ts` :
  - `geocode(query)` : `GET https://api-adresse.data.gouv.fr/search/?q=<query>&limit=5`
    - Mapping BAN : `feature.properties.label` → `placeName`, `feature.properties.city` → `commune`, `feature.properties.context` (ex: `"75, Paris, Île-de-France"`) → parser `departmentCode` (premier segment), `department` et `region`, `feature.geometry.coordinates` → `[longitude, latitude]`
  - `reverseGeocode(lat, lng)` : `GET https://api-adresse.data.gouv.fr/reverse/?lon=<lng>&lat=<lat>`
    - Même mapping que `geocode`
  - `resolveDepartment(lat, lng)` : inchangée (déjà sur `geo.api.gouv.fr`)
  - Retirer la constante `MAPBOX_TOKEN` en tête de fichier
- [ ] Créer `tests/unit/services/geocoding.test.ts` avec Vitest :
  - Test `geocode` avec mock `fetch` retournant une fixture BAN
  - Test `reverseGeocode` avec mock `fetch`
  - Test de robustesse : réponse vide → retour `[]` / `null`
- [ ] Retirer `MAPBOX_SECRET_TOKEN` de `src/lib/env.ts` (ou le marquer `optional` si encore utilisé ailleurs — vérifier avec `grep -r "MAPBOX_SECRET_TOKEN" src/`)
- [ ] Mettre à jour `.env.example` pour supprimer `MAPBOX_SECRET_TOKEN`

**Tech**
- API BAN : `https://api-adresse.data.gouv.fr` — pas de clé, CORS ouvert, limite de taux généreuse (usage non authentifié)
- Format réponse BAN : GeoJSON `FeatureCollection`, `feature.properties.context` = `"<dept_code>, <dept_name>, <region_name>"`
- `resolveDepartment` restera inchangée — elle est déjà sur `geo.api.gouv.fr` et fonctionne bien
- La suppression de `MAPBOX_SECRET_TOKEN` de Vercel se fait en ML-07 (après validation prod)

**Hors scope**
- Géocodage batch ou autocomplétion avancée
- Cache des résultats de géocodage

**Effort** : 0,5 jour
**Dépendances** : ML-02 (pour valider que la variable env est retirée proprement)
**Labels** : `migration`, `maps`, `web`

---

## ML-06 — [Web] Customiser le thème Protomaps et brancher la couche satellite IGN WMTS

**Contexte**
Le thème Protomaps par défaut peut différer visuellement du style `outdoors` Mapbox actuellement utilisé. Ce ticket soigne le rendu visuel et branche la couche satellite IGN (déjà whitelistée dans `next.config.mjs`) sur le toggle de `MapControls`.

**Acceptance criteria**
- Given : `NEXT_PUBLIC_MAP_PROVIDER=maplibre`, style vecteur actif
- When : on ouvre `/map` avec un fond de carte dense (zoom 12, cluster de spots en Bretagne)
- Then : les cours d'eau, routes, communes sont lisibles et distincts des marqueurs de spots (pas de confusion couleur)

- Given : on clique sur le bouton satellite dans `MapControls`
- When : la carte change de style
- Then : la couche raster IGN ortho (`ORTHOIMAGERY.ORTHOPHOTOS` via `data.geopf.fr/wmts`) s'affiche
- And : les marqueurs de spots restent visibles par-dessus la couche satellite

- Given : `/my-spots/[id]` (mini-carte, zoom 13)
- When : la page se charge
- Then : le rendu vecteur est lisible à ce zoom (rues, bâtiments visibles)

- Given : `/map` avec la couche `heatmap` activée
- When : la heatmap est rendue
- Then : les couleurs de la heatmap restent lisibles sur le fond vecteur Protomaps

**Tasks**
- [ ] Évaluer le thème Protomaps par défaut (`protomaps-themes-base`) sur les vues `/map`, `/my-spots/[id]`, `/map` avec heatmap — noter les écarts avec le style Mapbox actuel
- [ ] Si le thème de base est insuffisant : créer `src/lib/map-style.ts` qui exporte une fonction `buildMapStyle(pmtilesUrl: string): StyleSpecification` en personnalisant les couleurs des couches `water`, `roads`, `landuse` avec les tokens de couleur Tailwind du projet (se référer à `mobile/src/theme/colors.ts` pour la palette)
- [ ] Mettre à jour `MAP_STYLES` dans `src/lib/map.ts` :
  - `vector` : style Protomaps (JSON inline ou URL vers style JSON statique)
  - `satellite` : style MapLibre avec source WMTS IGN (`https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image%2Fjpeg`)
- [ ] Vérifier que le toggle `MapControls.tsx` fonctionne correctement avec les nouvelles valeurs de `MAP_STYLES`
- [ ] Tests visuels manuels sur les 4 vues mentionnées dans les AC

**Tech**
- Fichiers impactés : `src/lib/map.ts` (ou nouveau `src/lib/map-style.ts`), `src/components/map/MapControls.tsx`
- `src/services/ign-ortho.service.ts` (WMS statique) reste inchangé — il est utilisé pour les vignettes de spots, pas pour la couche map
- Le WMTS IGN PM (Pseudo-Mercator) est compatible avec MapLibre GL JS
- Point d'attention : le style satellite MapLibre doit inclure une source vecteur minimale (labels de communes) pour rester lisible — ajouter une couche `symbol` labels par-dessus la couche raster IGN

**Hors scope**
- Création d'un style custom complet (niveau éditeur Mapbox Studio) — le thème Protomaps de base avec ajustements mineurs suffit
- Styles dark/light mode

**Effort** : 1-2 jours (1 j si le thème de base est satisfaisant, 2 j si personnalisation approfondie nécessaire)
**Dépendances** : ML-04
**Labels** : `migration`, `maps`, `web`, `perf`

---

## ML-07 — [Web] Mesure bundle + Lighthouse, nettoyage token Mapbox, MAJ docs

**Contexte**
Clôture du chantier web. On mesure le gain réel, on retire les dernières traces Mapbox de prod, et on met à jour les docs de référence. Ce ticket ne touche pas de code fonctionnel.

**Acceptance criteria**
- Given : `npm run analyze` est lancé avec `NEXT_PUBLIC_MAP_PROVIDER=maplibre`
- When : le rapport bundle s'affiche
- Then : `mapbox-gl` n'apparaît pas dans le graphe ; le gain par rapport au bundle pré-migration est documenté dans le ticket (commentaire de merge)

- Given : un test Lighthouse est lancé sur `/map` avec throttling 4G simulé
- When : la page est chargée
- Then : LCP ≤ 3,5 s et INP ≤ 200 ms (ou amélioration mesurable par rapport à la baseline pré-migration)

- Given : les variables `NEXT_PUBLIC_MAPBOX_TOKEN` et `MAPBOX_SECRET_TOKEN` sont retirées du dashboard Vercel
- When : l'app est redéployée
- Then : aucune erreur runtime liée au token Mapbox (confirmer avec un smoke test sur `/map` et `/my-spots/[id]`)

**Tasks**
- [ ] Lancer `npm run analyze` en mode maplibre — noter la taille du bundle client (page `/map`) avant/après dans le commentaire de PR
- [ ] Lancer Lighthouse CLI sur `http://localhost:3000/map` avec profil `mobile` throttle 4G — noter LCP et INP
- [ ] Retirer `NEXT_PUBLIC_MAPBOX_TOKEN` et `MAPBOX_SECRET_TOKEN` du dashboard Vercel (après validation en prod)
- [ ] Retirer la variable `NEXT_PUBLIC_MAP_PROVIDER` (feature flag) une fois le déploiement prod validé — la valeur par défaut devient `maplibre` en dur
- [ ] Mettre à jour `CLAUDE.md` section Stack : `mapbox-gl` → `maplibre-gl`, supprimer la mention `NEXT_PUBLIC_MAPBOX_TOKEN`
- [ ] Mettre à jour `docs/tech-debt.md` : archiver les items liés à Mapbox si présents, ajouter une note de clôture migration
- [ ] Vérifier `src/lib/env.ts` : retirer ou marquer `.optional()` les entrées `NEXT_PUBLIC_MAPBOX_TOKEN` et `MAPBOX_SECRET_TOKEN`

**Tech**
- Fichiers impactés : `CLAUDE.md`, `docs/tech-debt.md`, `src/lib/env.ts`, `.env.example`
- Aucune modification de code fonctionnel dans ce ticket
- Gain attendu : ~580 KB gzipped (taille de `mapbox-gl` + son worker)

**Hors scope**
- Optimisation bundle hors migration Mapbox (sujet distinct)
- Audit Lighthouse des autres pages

**Effort** : 0,5 jour
**Dépendances** : ML-06, ML-05
**Labels** : `migration`, `maps`, `perf`, `web`

---

## ML-08 — [Mobile] Migrer @rnmapbox/maps → @maplibre/maplibre-react-native dans mobile/

**Contexte**
L'app Expo utilise `@rnmapbox/maps` v10 dans `mobile/package.json`. La carte mobile est actuellement un placeholder (voir `mobile/app/(tabs)/map.tsx` — affiche "Integration Mapbox a venir"). C'est l'occasion d'intégrer directement MapLibre RN sans passer par Mapbox du tout. Le ticket couvre l'installation, l'intégration native (Expo dev client requis) et le rendu des spots sur la carte mobile.

**Acceptance criteria**
- Given : l'app Expo est buildée avec un dev client incluant `@maplibre/maplibre-react-native`
- When : un utilisateur ouvre l'onglet carte sur iOS
- Then : la carte s'affiche avec les tuiles PMTiles R2, centrée sur la France

- Given : un utilisateur ouvre l'onglet carte sur Android
- When : la carte s'affiche
- Then : idem iOS — tuiles PMTiles, carte interactive, pas de crash

- Given : des spots sont chargés via `useSpots`
- When : la carte est affichée
- Then : les marqueurs de spots apparaissent aux bonnes coordonnées avec clustering via `supercluster`

- Given : l'utilisateur autorise la géolocalisation
- When : il appuie sur le bouton "Localiser"
- Then : la carte centre sur sa position avec zoom 13

- Given : l'app est en mode avion
- When : l'utilisateur ouvre la carte
- Then : la carte ne crashe pas (comportement gracieux — tuiles non disponibles mais pas d'erreur fatale)

**Tasks**
- [ ] Inventorier les usages de `@rnmapbox/maps` dans `mobile/` : `grep -r "@rnmapbox" mobile/` — confirmer que seul `mobile/app/(tabs)/map.tsx` est concerné (le fichier est un placeholder sans import rnmapbox actif)
- [ ] `cd mobile && npm remove @rnmapbox/maps`
- [ ] `cd mobile && npm install @maplibre/maplibre-react-native`
- [ ] Créer `mobile/app/(tabs)/map.tsx` (remplacement complet du placeholder) :
  - Import `MapLibreRN` depuis `@maplibre/maplibre-react-native`
  - Enregistrer le protocole PMTiles : `MapLibreRN.setAccessToken(null)` + configuration de la source PMTiles R2
  - Composant `<MapLibreRN.MapView>` avec style vecteur PMTiles
  - Réutiliser `useMapStore` et `useLocation` (déjà présents dans `mobile/src/`)
  - Implémenter le clustering des spots via `supercluster` (déjà en dépendance dans `mobile/package.json`)
  - Bouton "Localiser" existant branché sur `MapLibreRN.Camera`
  - Bouton "Filtres" existant — panneau déjà fonctionnel, inchangé
- [ ] Créer un dev client Expo incluant le module natif (`eas build --profile development` ou `expo prebuild` selon le setup CI)
- [ ] Tester sur iOS simulator + Android emulator
- [ ] Tester le mode avion (tuiles unavailable)
- [ ] Mettre à jour `mobile/package.json` : retirer `@rnmapbox/maps`, vérifier que `@maplibre/maplibre-react-native` est à la version compatible Expo 55 / RN 0.83

**Tech**
- Fichiers impactés : `mobile/package.json`, `mobile/app/(tabs)/map.tsx`
- `@maplibre/maplibre-react-native` est un module natif — incompatible avec Expo Go, nécessite un dev client ou un build natif
- Mobile suspendu en mode PWA-only : ne pas ajouter de variable mobile. Utiliser `NEXT_PUBLIC_PMTILES_URL` pour le web/PWA.
- `mobile/src/stores/map.store.ts` reste inchangé (gère viewport + filters, pas de dépendance Mapbox)
- Risque : compatibilité `@maplibre/maplibre-react-native` avec Expo SDK 55 et RN 0.83 — à vérifier dans la matrice de compatibilité du repo MapLibre RN avant de démarrer

**Hors scope**
- Écran détail spot mobile (pas de carte sur `mobile/app/spots/[slug].tsx` actuellement)
- Mode offline avec tuiles pré-téléchargées sur device (sujet séparé, lié à `expo-sqlite`)
- Style satellite sur mobile (parity web non requise pour ce ticket)

**Effort** : 2-3 jours (2 j si la compatibilité Expo 55 est immédiate, 3 j si des shims natifs sont nécessaires)
**Dépendances** : ML-01 (PMTiles R2 disponibles)
**Labels** : `migration`, `maps`, `mobile`

---

## Risques & Rollback

### Risques identifiés

**R1 — Compatibilité react-map-gl v8 + MapLibre (impact : Lot 1)**
`react-map-gl` v8 supporte officiellement MapLibre via le sous-import `/maplibre`. Cependant, le type `MapboxEvent` utilisé dans `MapContainer.tsx` ligne 70 (`handleLoad`) n'existe pas dans l'API MapLibre — à remplacer par le type natif MapLibre. Risque faible, correction locale.

**R2 — Rendu visuel Protomaps insuffisant (impact : Lot 3)**
Le thème Protomaps par défaut est sobre. Si les cours d'eau et routes ne sont pas suffisamment distincts des marqueurs de spots, une personnalisation de style sera nécessaire (jusqu'à 2 j supplémentaires). Mitigation : évaluer le thème dès le début de ML-06 sur un environnement local avant de s'engager sur 1 j vs 2 j.

**R3 — Compatibilité @maplibre/maplibre-react-native avec Expo SDK 55 + RN 0.83 (impact : Lot 5)**
MapLibre RN publie des matrices de compatibilité. La version supportant RN 0.83 est à vérifier avant de démarrer ML-08. Si la version stable ne supporte pas encore RN 0.83, un pin sur une version RC ou un fork est nécessaire. Mitigation : ouvrir la page de releases de `@maplibre/maplibre-react-native` dès le début du Lot 5.

**R4 — PMTiles React Native (impact : Lot 5)**
Le protocole PMTiles est bien supporté côté web (via le package `pmtiles`). Côté React Native, le support natif est plus récent. Vérifier que `@maplibre/maplibre-react-native` expose bien une API pour enregistrer des protocoles custom (équivalent de `addProtocol` web). Alternative : servir les tuiles via une URL HTTPS classique (R2 supporte les Range requests, compatible avec MapLibre RN sans protocole custom).

**R5 — Cache ServiceWorker et Range requests PMTiles (impact : Lot 1 / Lot 4)**
La Cache API des navigateurs ne supporte pas nativement les Range requests (renvoi `206`). PMTiles effectue des Range requests pour ne lire que les tuiles nécessaires. La règle Cache First actuelle dans `sw.js` doit être adaptée pour ne pas cacher les réponses partielles — ou s'assurer que l'URL PMTiles n'est pas interceptée par le SW (laisser passer directement vers R2 qui a son propre CDN). À décider en ML-04.

### Stratégie de rollback

Le feature flag `NEXT_PUBLIC_MAP_PROVIDER=mapbox|maplibre` (posé en ML-02) permet un rollback immédiat sans redéploiement de code, en changeant une variable d'env dans Vercel.

Procédure de rollback :
1. Dans le dashboard Vercel, passer `NEXT_PUBLIC_MAP_PROVIDER` de `maplibre` à `mapbox`
2. Forcer un redéploiement (ou attendre le prochain déploiement automatique)
3. Vérifier `/map` — les tuiles Mapbox reprennent le dessus

Condition de suppression du flag : ML-07 terminé, validé en prod depuis 48 h sans incident.

Le token Mapbox (`NEXT_PUBLIC_MAPBOX_TOKEN`) est conservé dans les envs Vercel jusqu'à ML-07 précisément pour permettre ce rollback.
