# Dette technique

> Sévérité : CRITICAL (< 1 semaine) | HIGH (trimestre) | MED (au fil de l'eau) | LOW (opportuniste)
> Maintenu par l'agent `tech-debt-tracker`. Ajouts manuels OK aussi.

## Critical

### Migrations Prisma cassées pour fresh installs locaux
- **Fichiers** : `prisma/migrations/20260301120000_remove_reservoir_water_type/migration.sql`
- **Constat** : la migration référence 3 tables (`species_observations`, `water_quality_snapshots`, `biological_indices`) créées dans `0_init` puis droppées dans `1_schema_sync`. Sur une DB fraîche locale, la migration crash car les tables n'existent plus quand elle s'exécute. Sur prod (Neon), elle a probablement été appliquée à l'époque où les tables existaient encore.
- **Impact** : impossible de faire tourner `prisma migrate deploy` sur un environnement frais sans intervention manuelle. Bloque l'onboarding d'un nouveau contributeur. Workaround actuel : `prisma migrate resolve --applied 20260301120000_remove_reservoir_water_type`.
- **Fix proposé** : ré-écrire la migration en idempotent (`DO $$ IF EXISTS ... DELETE ... END IF $$`). Vérifier au passage la cohérence des autres migrations (1_schema_sync semble droiter ces 3 tables sans laisser de trace SQL — peut-être un `prisma db push` non versionné).
- **Détecté** : 2026-05-18 (test seed local pendant ML-06)

### Drift schema Prisma ↔ DB locale
- **Fichiers** : `prisma/schema.prisma` vs migrations versionnées
- **Constat** : `prisma db push` détecte 8+ colonnes (`maxLengthCm`, `maxWeightKg`, `optimalTempMin`, etc. sur `FishSpecies`) + une contrainte unique (`spots.externalId`) + le retrait de l'enum `RESERVOIR` qui ne sont **pas** capturés par les migrations versionnées. Le schema a évolué via `prisma db push` direct quelque part, sans migration committée.
- **Impact** : prod (Neon) et local divergent. Un nouveau contributeur qui fait `migrate deploy` se retrouve avec un schéma incomplet. Workaround : `prisma db push --accept-data-loss` après migrate deploy.
- **Fix proposé** : faire un `prisma migrate dev --name sync_schema_drift` pour générer la migration manquante depuis l'état actuel, la commiter. Appliquer sur prod si pas déjà fait.
- **Détecté** : 2026-05-18

### `fast-xml-parser` vulnérable (CVE multiples, dont une critical) — dep transitive de `@aws-sdk/client-s3`
- **Constat** : `npm audit` rapporte 1 critical sur `fast-xml-parser <=5.6.0` (entity encoding bypass, DoS via expansion, stack overflow). C'est une dépendance transitive remontant probablement via `@aws-sdk/client-s3` (parsing XML S3/R2).
- **Impact** : risque exploitable uniquement si on parse du XML contrôlé par un attaquant. Côté serveur on parse uniquement des responses S3 légitimes — donc impact pratique faible, mais classification critique côté CVE.
- **Fix proposé** : `npm audit fix` (peut bumper AWS SDK). Vérifier que ça ne casse pas l'upload R2 images ni l'upload Vercel Blob.
- **Détecté** : 2026-05-18 (lors de l'install MapLibre en ML-02 — pré-existant, non introduit par cet install)

### CI/CD ne se déclenche jamais — workflows ciblent les mauvaises branches
- **Fichiers** : `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
- **Constat** : les workflows écoutent `push.branches: [main, develop]` et `pull_request.branches: [main]`, mais la branche par défaut du repo est `master`. Aucun job CI ni déploiement automatique ne tourne sur les commits actuels.
- **Impact** : pas de typecheck, pas de tests, pas de déploiement automatique sur `master`. Régressions et fuites de qualité passent inaperçues. Le déploiement Vercel sur prod n'a probablement plus tourné depuis le passage à `master` (ou n'a jamais tourné via Action — possiblement remplacé par l'intégration Vercel native).
- **Fix proposé** : remplacer `main` par `master` dans les deux workflows (ou renommer la branche par défaut). Confirmer si Vercel utilise déjà l'intégration native Git→Vercel pour le déploiement (auquel cas `deploy.yml` est doublement obsolète).
- **Détecté** : 2026-04-26 (onboarding)

## High

### Pas de `.env.example` versionné
- **Constat** : le seul `.env` du repo est gitignored et contient des valeurs réelles. Aucun template versionné.
- **Impact** : onboarding contributeur impossible sans demander la liste des variables. Risque qu'un contributeur committe ses propres valeurs faute de modèle.
- **Fix proposé** : créer `.env.example` avec toutes les clés mais valeurs vides ou placeholders. Référencer dans le README.
- **Détecté** : 2026-04-26 (onboarding)

### Pas de README projet
- **Constat** : aucun `README.md` à la racine. Setup, architecture, et points d'entrée invisibles.
- **Impact** : friction onboarding, friction GitHub repo public/contributeurs.
- **Fix proposé** : README minimal — quick start (`npm install` + docker compose + `npm run dev`), liens vers `/docs/` et `CLAUDE.md`.
- **Détecté** : 2026-04-26 (onboarding)

### CORS API ouvert à `*`
- **Fichier** : `next.config.mjs:48`
- **Constat** : `Access-Control-Allow-Origin: '*'` sur tous les endpoints `/api/:path*`. L'app mobile (Expo) est consommatrice légitime, mais autoriser tout origin expose les endpoints à n'importe quel site tiers (notamment routes authentifiées via cookie session).
- **Impact** : surface CSRF élargie côté navigateur ; potentiel scraping ou abus depuis sites tiers.
- **Fix proposé** : restreindre à une allow-list (`https://fish-point.app`, `http://localhost:3000`, schémas Expo `exp://`, etc.) avec `Vary: Origin`. Pour mobile natif, le header CORS est inutile (RN ne l'applique pas) — seul le web l'applique.
- **Détecté** : 2026-04-26 (onboarding)

## Medium

### Déduplication des spots auto-découverts (data, hors no-migration)
- **Fichiers** : table `spots` (DB) ; côté affichage `src/lib/spot-name.ts`
- **Constat** : des spots auto-découverts (imports OFB/externes) sont dupliqués géographiquement — même plan d'eau importé plusieurs fois avec des `externalId` distincts et des noms quasi identiques (« Jetée (01-25797529) » vs « Jetée (01-25797530) » à quelques mètres). La sous-tranche 8 nettoie l'AFFICHAGE du nom (`formatSpotName`) mais **ne déduplique pas** : un vrai dédup demande un travail data/DB (clustering géo + clé de fusion + migration), hors périmètre no-migration de la tranche.
- **Impact** : la liste et la carte montrent plusieurs marqueurs pour un même point d'accès réel → impression de base bruitée, et après formatage du nom, des libellés identiques (« Jetée — Annecy » ×3) deviennent visuellement indiscernables (le suffixe technique qui les distinguait est masqué).
- **Fix proposé** : (1) job de clustering géospatial (PostGIS `ST_DWithin`) pour grouper les candidats < ~30 m + similarité de nom ; (2) clé de fusion / table de mapping `canonical_spot_id` ; (3) UI de revue pour les fusions ambiguës. Préférer additif (champ `mergedIntoId` nullable) à un drop destructif.
- **Détecté** : 2026-06-19 (sous-tranche 8, volet A)

### Sections de fiche qui disparaissent silencieusement quand vides (`return null`) — PARTIELLEMENT RÉSOLU 2026-06-19
- **Fichiers** : `src/components/spots/{SpotWaterQuality,SpotObservations,SpotBiodiversity,SpotProtectedZones,SpotSpawnCalendar}.tsx`
- **Constat** : la sous-tranche 8 (volet B) a traité le cas **critique** — `SpotRegulations` n'affiche plus « Aucune restriction spécifique connue » mais un état « Donnée indisponible » + CTA. La sous-tranche 9 a extrait `src/components/spots/DataUnavailable.tsx` (composant présentationnel + helper pur `shouldShowDataUnavailable`, testé sous `tests/unit/components/data-unavailable.test.ts`) et l'a branché sur **`SpotWaterQuality`, `SpotObservations`, `SpotBiodiversity`** : ces 3 sections affichent désormais l'état explicite + CTA `Ajouter une observation` (→ `/spots/[slug]/edit`) **uniquement sur succès vide** (jamais pendant `isLoading`/`isError`). Au passage, les `queryFn` de `SpotWaterQuality` et `SpotObservations` qui avalaient l'échec HTTP (`if (!res.ok) return []`) **throw** maintenant, pour que react-query expose `isError` ; `SpotBiodiversity` (hook `useState`/`useEffect` au `catch` silencieux) a gagné un état `isError` explicite.
- **Reste reporté** (raisons techniques, pas seulement budget) :
  - **`SpotProtectedZones`** : n'expose PAS `isLoading` (`const { data } = useQuery` → `return null` couvre chargement + vide + erreur indistinctement). Brancher le gating sûr impose d'ajouter `isLoading`/`isError` au hook + throw dans le `queryFn`. Sémantiquement, une zone protégée *absente* est une info neutre (pas un trou de donnée), le besoin de CTA y est plus faible.
  - **`SpotSpawnCalendar`** : **pas fetch-based** — composant pur dérivé des `species` props (`return null` si aucune espèce n'a de mois de frai). « Vide » n'est donc jamais une panne réseau ; un état « donnée indisponible — observation » y serait sémantiquement faux. À traiter, si besoin, avec un libellé différent (« calendrier de frai non renseigné »), pas via `DataUnavailable`.
- **Fix proposé (reste)** : pour `SpotProtectedZones`, refactorer le `useQuery` (exposer `isLoading`/`isError`, throw sur `!res.ok`) puis appliquer `shouldShowDataUnavailable` comme sur les 3 sections traitées.
- **Détecté** : 2026-06-19 (sous-tranche 8, volet B — reporté) · **Partiellement résolu** : 2026-06-19 (sous-tranche 9 : 3/5 sections)

### Espace « Enregistrés » invité — pas de fusion local → compte au login
- **Fichiers** : `src/lib/offline-db.ts` (store `savedSpots`), futur hook de sync
- **Constat** : les saves invité atterrissent dans IndexedDB (`savedSpots`). Au login, ils ne sont pas remontés vers le serveur (modèle `Favorite`). La sync compte est explicitement hors périmètre de la sous-tranche 6.
- **Impact** : un visiteur qui enregistre 3 spots puis se connecte ne les retrouve pas dans ses favoris serveur (ils restent locaux).
- **Fix proposé** : au passage `unauthenticated → authenticated`, lire `getSavedSpots()`, POST chacun vers `/api/spots/favorites`, puis `removeSavedSpot`. À faire dans le futur espace « Enregistrés » (sous-tranche suivante avec les collections).
- **Détecté** : 2026-06-18 (sous-tranche 6)

### Migrer le stockage des images R2 → Vercel Blob
- **Fichiers** : `src/lib/r2.ts`, vars `R2_*` dans `src/lib/env.ts`
- **Constat** : les images de spots sont stockées sur Cloudflare R2 (bucket `fishspot-images`). Pendant la migration Mapbox→MapLibre, on a fait le choix de Vercel Blob pour les PMTiles afin de garder un seul vendeur. Les images restent sur R2 pour ne pas alourdir le chantier.
- **Impact** : 2 vendeurs de stockage à gérer (R2 + Blob), 2 jeux de secrets, 2 dashboards. Cohérence imparfaite.
- **Fix proposé** : ré-écrire `src/lib/r2.ts` sur `@vercel/blob` (upload/delete identiques), migrer les URLs existantes dans la DB (script de batch update), retirer les vars `R2_*`. À mesurer côté coût avant d'attaquer : R2 a 0 $ d'egress, Vercel Blob facture au-delà du pool inclus → si le trafic images dépasse 100 Go/mois (Hobby) ou 1 To/mois (Pro), garder R2.
- **Quand** : à programmer après ML-07 (clôture migration carto), pas urgent.
- **Détecté** : 2026-05-18

### Explorer — bornage liste par bbox simplifié + deux modèles de filtres parallèles
- **Fichiers** : `src/app/api/spots/route.ts` (filtre `north/south/east/west`), `src/app/(main)/spots/page.tsx`, `src/store/map.store.ts` (`committedBounds`), `src/components/map/MapFilters.tsx` vs `src/components/filters/FilterRail.tsx`
- **Constat** : la sous-tranche 2 Explorer borne la **liste** à la zone carte via un filtre Prisma simple `latitude/longitude BETWEEN` (pas de PostGIS `ST_Intersects` comme `/api/spots/bbox`). Acceptable pour des bbox rectangulaires axis-aligned, mais (1) pas de cache Redis sur cette branche du handler `/api/spots` (le `/bbox` en a un), (2) pas de cap explicite du nombre de résultats hors `limit=60` côté liste. Par ailleurs deux jeux de filtres coexistent toujours : `MapFiltersState` (store, couches carte) et `GridFilters`/`FilterRail` (liste) — l'unification est prévue en sous-tranche 5.
- **Impact** : double source de filtres = risque de divergence carte/liste (un filtre appliqué à la liste n'affecte pas les tuiles MVT et inversement). Le bornage lat/lng simple ignore la courbure et les bbox traversant l'antiméridien (non pertinent pour la France métropolitaine, donc sans impact pratique ici).
- **Fix proposé** : unifier `SpotFilters` comme modèle unique consommé par la carte (tuiles + couches) ET la liste ; envisager d'aligner le bornage liste sur `ST_Intersects` si on ajoute des zones non rectangulaires.
- **Ajout sous-tranche 3** : `src/components/filters/FilterRail.tsx` et `SpotGridFilters.tsx` dupliquent la logique `hasActiveFilters` / `EMPTY_FILTERS` (re-calculée aussi dans `spots/page.tsx` pour l'état vide). À factoriser dans un seul helper partagé lors de l'unification.
- **Ajout sous-tranche 5 (filtres « sortie »)** : les nouveaux champs (`species`, `fishingMode`, `fishingTechnique`, `parking`, `boatLaunch`, `pmr`, `nightFishing`, `lat/lng/radius`) ont été ajoutés à `GridFilters` ET branchés sur `/api/spots` (Zod inline), MAIS **la grande unification du modèle de filtres n'a PAS été faite** (hors budget ≤ 6 fichiers, sous-tranche dédiée). `MapFiltersState` possède déjà `fishingTypes`/`species`/`pmr`/`nightFishing` mais N'a PAS reçu mode/technique/parking/boatLaunch/radius-around-me : la divergence carte/liste persiste et s'élargit légèrement. À traiter en priorité lors de l'unification : un seul `SpotFilters` (web) consommé par tuiles + couches + liste, avec un helper `classifyFishingType` partagé pour les sections Mode/Technique.
- **Schéma de query Zod inline (RÉSOLU 2026-06-19, sous-étape 3)** : `spotsListQuerySchema` est désormais centralisé dans `src/validators/spot.schema.ts` (avec son type `SpotsListQuery` et le mapper pur `toSpotQueryFilters`), réutilisant les enums Zod déjà définis là (`WaterTypeEnum`, `WaterCategoryEnum`, `FishCategoryEnum`). Disponible pour le typage client lors de l'unification.
- **Sous-tranche 11 (convergence — 1ʳᵉ sous-étape, PARTIELLEMENT RÉSOLU 2026-06-19)** : la **divergence carte ↔ liste sur les filtres « sortie » est supprimée**. Nouveau helper PUR partagé `src/lib/spot-filter-params.ts` (`serializeSpotFilters` / `parseSpotFilterParams` / `splitFishingTypes` / `activeAccessibilityFlags`) = source UNIQUE de la traduction « filtres → query string → WHERE ». Les **tuiles MVT** (`/api/spots/tiles/[z]/[x]/[y]`) consomment ce parser et appliquent désormais espèce, mode/technique, fishCategory, waterCategory, accessType, search, department, parking/boatLaunch, max-score — exactement comme `/api/spots`. `MapContainer` reçoit un prop `spotFilters` et sérialise via le helper depuis la **même source d'état que la liste** (`gridFilters` → `mapFilters` dans `spots/page.tsx`). Plus de noms de params divergents (`fishingType` singulier conservé en alias legacy uniquement pour le panneau overlay `MapFilters` et la carte autonome `/map`, dont le comportement est inchangé). Testé : `tests/unit/lib/spot-filter-params.test.ts` (round-trip + invariants WHERE). **Reste à faire** (sous-étapes 3-5 ci-dessous).
  - **Sous-étape 2 (RÉSOLU 2026-06-19)** : la traduction « `SpotQueryFilters` → `where` Prisma » de la liste est factorisée. Nouveau helper PUR exporté `buildSpotWhere(filters: SpotQueryFilters): Prisma.SpotWhereInput` dans `src/lib/spot-where.ts` ; `/api/spots/route.ts` le consomme à la place de son bloc `where` inline (extraction ISO-fonctionnelle : mêmes clés, même sémantique — FREE inclut `accessType: null`, mode+technique = deux `fishingTypes.hasSome` en AND, accessibilité via `accessibility.path/equals`, bornes de score `gte/lte`). Le route handler conserve uniquement la base `status: 'APPROVED'` et les bornes géo hors type canonique (north/south/east/west, lat/lng/radius) fusionnées par-dessus. Constantes `MODE_SET`/`TECHNIQUE_SET` du route retirées (filtrage défensif désormais dans `splitFishingTypes`). Testé : `tests/unit/lib/spot-where.test.ts` (forme du `where` par filtre + jeu complet). La duplication serveur restante est la traduction côté **tuiles** (raw SQL, pas un `SpotWhereInput`) : non fusionnable avec `buildSpotWhere` sans réécriture des tuiles en Prisma — laissée hors scope.
  - **Sous-étape 3 (RÉSOLU 2026-06-19)** : `spotsListQuerySchema` (Zod) est déplacé dans `src/validators/spot.schema.ts` et aligné sur `SpotQueryFilters` (typage serveur unique, réutilisable client). Extraction **iso-fonctionnelle** : helpers (`numeric`, `boolFlag`, `AccessTypeEnum`, `FishingModeEnum`, `FishingTechniqueEnum`), schéma et mapper `toSpotQueryFilters(q): SpotQueryFilters` déplacés tels quels ; mêmes règles, mêmes defaults (`default([])`, `page=1`, `limit=20`), mêmes rejets 400. `route.ts` n'importe plus que `spotsListQuerySchema` + `toSpotQueryFilters` (imports `z`, `WaterTypeEnum`, `WaterCategoryEnum`, `FishCategoryEnum`, `FISHING_MODE_TYPES`, `FISHING_TECHNIQUE_TYPES` retirés du route, désormais internes au schéma). Testé : `tests/unit/validators/spots-list-query.schema.test.ts`.
  - **Sous-étape 4 (RÉSOLU 2026-06-19 — option A retenue)** : l'ÉTAT de filtres est désormais UNIQUE. Le type `MapFiltersState` et le slice `filters`/`isFiltersOpen` du store (`src/store/map.store.ts`) sont **supprimés** ; le panneau overlay `src/components/map/MapFilters.tsx` est **retiré** (tombstone `export {}` laissé en place faute d'outil de suppression côté agent — **à `git rm`**). `FilterRail` est le contrôle de filtres UNIQUE (liste + carte de l'Explorer) et a **absorbé** les deux filtres exclusifs de l'overlay : `premiumOnly` et `showAutoDiscovered`, ajoutés à `GridFilters`/`EMPTY_FILTERS`, au type canonique `SpotQueryFilters` (+ serialize/parse vers `premiumOnly=true` / `origin=USER`, params déjà lus par la route tuiles) et à l'UI FilterRail (section « Affichage », 2 `CheckRow` a11y). `MapContainer` lit ses filtres exclusivement via le prop `spotFilters` (tuiles MVT + filtre JS `filteredSpots` des couches heatmap/fishability) — plus aucune lecture du store pour les filtres. `/map` (orphelin, hors nav) **redirige** vers `/spots` (`redirect('/spots')`). Aucune capacité de filtre perdue. Testé : `tests/unit/lib/spot-filter-params.test.ts` (bloc « absorption des filtres exclusifs carte ») + 3 tests store adaptés (n'utilisent plus le slice filtres supprimé). **Résidu mineur** : `legacyFishingTypes` (`fishingType` singulier) n'est plus émis par personne — toléré côté route tuiles par robustesse, à retirer un jour. **Non étendu volontairement** : la **liste** `/api/spots` ne filtre toujours PAS sur `premiumOnly`/`origin` (l'overlay ne l'a jamais fait → zéro régression) ; les y câbler (route + `spotsListQuerySchema` + `buildSpotWhere` + `SpotFilters`) serait une amélioration nette hors budget atomique — à faire si le besoin produit se confirme.
  - **Sous-étape 5 (RÉSOLU 2026-06-19 — convergence CLOSE)** : (A) **Parité** — `buildSpotWhere` traduit désormais `premiumOnly === true → isPremium: true` et `showAutoDiscovered === false → dataOrigin: 'USER'` ; `spotsListQuerySchema`/`toSpotQueryFilters` acceptent `premiumOnly`/`origin` ; `/api/spots` (liste) les lit. La liste filtre donc `premium`/`auto-découverts` **comme la carte** (vérifié runtime : `?origin=USER` passe de 53 738 à 74). (B) **Nettoyage** — la copie JS `MapContainer.filteredSpots` est **supprimée** ; `HeatmapLayer`/`FishabilityLayer` consomment `spots` déjà filtrés côté serveur via `/api/spots/bbox`, qui applique le nouveau builder SQL **partagé** `src/lib/spot-where-sql.ts` (`buildSpotFilterSql`), lui-même réutilisé par les **tuiles MVT** (fin de la 4ᵉ copie SQL potentielle). `useMapSpots` propage les filtres + les inclut dans la clé de cache bbox. Cross-check runtime : `/api/spots/bbox?origin=USER` ≈ 74 = total liste. Testé : `spot-where.test.ts` (étendu premium/origin) + `spot-where-sql.test.ts` (nouveau).
  - **Bilan** : liste, tuiles et bbox/heatmap/fishability partagent 1 vocabulaire (`spot-filter-params`), 1 builder objet (`buildSpotWhere`), 1 builder SQL (`buildSpotFilterSql`). Plus de copie JS, plus de divergence. **Résidu mineur** : alias legacy `fishingType` (singulier) toléré dans `buildSpotFilterSql` pour vieux liens externes — supprimable à terme (non bloquant).
- **Détecté** : 2026-06-18 (sous-tranche 2 Explorer) ; **convergence close 2026-06-19** (sous-étapes 1→5).

### Scoring — personnalisation « adapté à votre sortie » + adoption des 3 indicateurs hors fiche
- **Fichiers** : `src/components/spots/SpotScorePanel.tsx`, `src/services/scoring.service.ts`, `src/components/spots/SpotFishIndex.tsx`, `src/components/spots/SpotCard.tsx`, popup marqueur carte
- **Constat (sous-tranche 4)** : le bloc « 3 indicateurs distincts » (indice de pêche / note communauté / fiabilité) + détail consultable du score est livré sur la **fiche** uniquement (`SpotScorePanel`). Trois suites non faites pour rester ≤ 6 fichiers :
  1. **Personnalisation par sortie** : `fishabilityScore` reste un score GLOBAL du spot (`0.45*static + 0.55*dynamic`), **non** pondéré par espèce/date/mode/distance de la requête utilisateur. Le wording est volontairement honnête (« Indice de pêche », « conditions actuelles ») et NE prétend PAS « adapté à votre sortie ». Le verdict personnalisé du backlog (« Très adapté à votre sortie : 78 % ») dépend des **filtres sortie** (sous-tranche P1 `SpotFilters` when/mode/technique) : il faudra un score dérivé côté serveur prenant la requête en entrée — ne pas le simuler côté UI.
  2. **Détail du score** : faute de granularité « espèce /30, conditions /20… » exposée par le code, `SpotScorePanel` affiche les **facteurs réels** renvoyés par `/api/spots/[id]/score` (`factors[]` : météo, eau, solunaire, sécheresse…) + la décomposition statique/dynamique réelle. Si on veut les barèmes /30 /20 du diagnostic, il faut que `scoring.service.ts` retourne des **sous-totaux nommés** (diversité, trophée, qualité d'eau, conditions, récence) au lieu d'un simple `staticScore`/`dynamicScore` agrégé.
  3. **Adoption carte/liste** : `SpotScorePanel` est conçu réutilisable mais n'est PAS encore branché sur `SpotCard` ni le popup marqueur (budget fichiers). À faire en sous-tranche suivante. Note : `SpotCard`/popup n'ont pas les signaux de fiabilité (`accessDetails`, `_count`) dans leur payload `SpotListItem` → soit enrichir `SpotListItem`, soit n'afficher sur la carte/liste que indice + note (sans fiabilité détaillée).
- **Doublon à résoudre** : `SpotFishIndex` (carte latérale « Activité piscicole ») affiche toujours le même score avec le wording technique « Statique 45% / Dynamique 55% » et la même liste de facteurs que le détail du `SpotScorePanel`. Redondance + jargon. À fusionner : soit `SpotFishIndex` devient une vue « conditions live » sans le score global, soit on le supprime au profit du détail du panel.
- **Détecté** : 2026-06-18 (sous-tranche 4 scoring)

### Filtres « sortie » non implémentables faute de données (sous-tranche 5)
- **Fichiers** : `prisma/schema.prisma` (`Spot`), `src/components/filters/FilterRail.tsx`, `src/services/scoring.service.ts`
- **Constat** : trois intentions du modèle cible « rechercher une SORTIE » n'ont **aucune colonne adossée** et n'ont donc PAS été implémentées (interdiction de simuler) :
  1. **« Quand = ce week-end / date future »** : il n'existe aucune prévision de pêchabilité par date. `fishabilityScore`/`dynamicScore` sont calculés pour « maintenant ». On ne peut au mieux exposer « Maintenant / Aujourd'hui » adossé au score courant. Dépendance : un **forecast-par-date** côté `scoring.service.ts` (entrée = date cible, sortie = score projeté à partir des prévisions météo/hydro).
  2. **« Niveau / difficulté du spot »** : aucun champ sur `Spot`. `User.level` est la **gamification utilisateur**, pas la difficulté d'un lieu. Dépendance : migration additive (`Spot.difficulty` enum nullable) + source de donnée (édito ou dérivée des avis).
  3. **Tri par distance exact** : le filtre « autour de moi » utilise une **bounding box approximée** (111 km/°, cos(lat)) côté `/api/spots`, pas un calcul de distance géodésique ni un tri par proximité. Pour un vrai tri/temps de trajet il faut PostGIS (`ST_DWithin`/`ST_Distance`, déjà utilisé par `/api/spots/bbox`) ou une matrice d'itinéraires.
- **Impact** : sans ces sources, les filtres « date future » et « niveau » seraient des leurres (ils suggéreraient une donnée inexistante). Le filtre distance est fonctionnel mais grossier (rectangle, pas de tri).
- **Fix proposé** : (1) ajouter un mode `targetDate` au scoring avant d'exposer un filtre date ; (2) migration `Spot.difficulty` + UI ; (3) brancher le rayon sur PostGIS pour un tri par distance exact.
- **Détecté** : 2026-06-18 (sous-tranche 5 filtres sortie)

### Couverture de tests faible
- **Constat** : 3 fichiers unit (`fish-index`, `regulations`, `spot.schema`), 3 specs E2E (`auth-flow`, `map-navigation`, `spot-creation`). Aucun seuil de couverture enforced. Surface fonctionnelle vaste (catches, community, dashboard, alerts, fishing-cards, private-spots, payments) très peu couverte.
- **Impact** : régressions silencieuses sur features non couvertes. Refactos risqués.
- **Fix proposé** : prioriser les flows à risque (paiement Stripe, sync offline catches, cron compute-alerts, auth mobile bearer). Voir `/docs/testing/strategy.md`.
- **Détecté** : 2026-04-26 (onboarding)

### Convention de commits inexistante
- **Constat** : commits courts, parfois cryptiques (`PRISE FIX`, `v0`, `mobile`, `perfs`). Pas de Conventional Commits, pas de scope, pas de référence ticket.
- **Impact** : `git log` peu lisible, génération de changelog automatique impossible, bisection difficile.
- **Fix proposé** : adopter Conventional Commits léger (`feat:`, `fix:`, `chore:`) sans imposer de tooling lourd.
- **Détecté** : 2026-04-26 (onboarding)

## Low

### `seed.ts` exclu du tsconfig
- **Fichier** : `tsconfig.json:41`
- **Constat** : `prisma/seed.ts` est exclu du typecheck. S'il contient du code à problème, il ne sera détecté qu'au runtime.
- **Fix proposé** : tsconfig dédié `tsconfig.scripts.json` ou inclusion + fix typage.
- **Détecté** : 2026-04-26 (onboarding)

### Pas de `.nvmrc` / `engines.node`
- **Constat** : `package.json` ne déclare pas `engines.node`. La version Node n'est fixée que dans les workflows CI (Node 20).
- **Fix proposé** : ajouter `"engines": { "node": ">=20" }` dans `package.json` + `.nvmrc` à `20`.
- **Détecté** : 2026-04-26 (onboarding)

### Cartes « conditions » de la sidebar fiche pas encore migrées aux tokens FS
- **Fichiers** : `src/components/spots/SpotWeather.tsx`, `SpotWaterLevel.tsx`, `SpotSolunar.tsx`
- **Constat** : ces 3 cartes voisines de la nouvelle « Conditions du jour » utilisent encore des couleurs Tailwind brutes (`text-blue-500`, `bg-amber-100 dark:bg-amber-900/30`, `text-green-600`…) au lieu des tokens design (`--fs-*` : `text-score-hi`, `text-amber-deep`, `border-line`…). Incohérence visuelle légère avec `SpotScorePanel` / `SpotFishIndex` (migrés). Hors scope de la sous-tranche 10 (Boy Scout limité au fichier touché).
- **Fix proposé** : migration locale des classes couleur vers les tokens FS lors d'un prochain passage sur ces cartes.
- **Détecté** : 2026-06-19 (sous-tranche 10)

## Resolved (archive 30 jours avant suppression)

### Enregistrer / Itinéraire — câblage liste + fiche (sous-tranche 7) — RÉSOLU 2026-06-18
- **Fichiers** : `src/components/spots/SpotCard.tsx`, `src/components/spots/SpotDetail.tsx`
- **Résolution** : `SpotCard` câble désormais `<SaveSpotButton variant="compact">` + un lien Itinéraire (`buildDirectionsUrl`) dans une barre d'actions **sortie du `<Link>`** (le `<Link>` est passé en stretched-link `after:absolute after:inset-0`, les actions sont en frère/sœur `relative z-10` → aucune ancre imbriquée, aucun clic action ne navigue). `SpotDetail` remplace le bouton inerte par `<SaveSpotButton>` et centralise le lien Itinéraire en dur sur `buildDirectionsUrl`. Enregistrer/Itinéraire sont maintenant disponibles depuis le marqueur, la liste ET la fiche, sans ouvrir la fiche.
- **Détecté** : 2026-06-18 (sous-tranche 6) · **Résolu** : 2026-06-18 (sous-tranche 7)

### Toast « Annuler » dédié (action in-toast) — RÉSOLU 2026-06-18
- **Fichiers** : `src/store/notification.store.ts`, `src/components/ui/toast.tsx`, `src/components/spots/SaveSpotButton.tsx`
- **Résolution** : ajout d'un champ optionnel `action?: ToastAction` (`{ label; onClick }`) au `Toast` (non-breaking), rendu comme bouton « Annuler » dans `ToastContainer`. `SaveSpotButton` passe `action: { label: 'Annuler', onClick: handleRemove }` au toast de succès → undo immédiat depuis le toast, en plus de la bascule du bouton. Couvert par `tests/unit/store/notification-toast-action.test.ts`.
- **Détecté** : 2026-06-18 (sous-tranche 6) · **Résolu** : 2026-06-18 (sous-tranche 7)
