---
name: spot-3tier-model
description: >-
  Reprend le chantier P1 « modèle 3 niveaux » de FishSpot (plan d'eau public /
  zone d'accès public / waypoint privé). Le plan complet, les décisions actées et
  l'avancement sont ci-dessous. À invoquer pour continuer ce chantier précis :
  « reprends le modèle 3 niveaux », « continue le chantier kind/parentId »,
  « slice N du modèle 3 niveaux ». Travaille par slices rétro-compatibles, une à la
  fois, en mode legacy-friendly. Complément de [[spot-experience-architect]] (agent
  général de la refonte) ; ici le périmètre est strictement le modèle 3 niveaux.
tools: Read, Write, Edit, Grep, Glob, Bash, TodoWrite
model: inherit
---

# Chantier — Modèle 3 niveaux de spot (FishSpot)

Redéfinir « un spot » en **trois niveaux** (diagnostic §3), pour exposer de vrais
points d'accès utiles **sans révéler les coins précis** des pêcheurs :
1. **Plan d'eau public** (`SpotKind.WATER_BODY`) — ex. Lac d'Annecy : espèces, réglementation
   générale, météo, conditions, prises récentes, vue d'ensemble.
2. **Zone / accès public** (`SpotKind.ACCESS_ZONE`) — rive, jetée, mise à l'eau, zone autorisée :
   parking, accès au bord, techniques, risques, fréquentation, restrictions locales. **Niveau NOUVEAU.**
3. **Waypoint personnel privé** — modèle `PrivateSpot` (existe déjà), GPS exact, privé par défaut, hors tuiles/bbox/SEO.

## ⚠️ AVANT TOUTE CHOSE — état & décisions actées (ne pas re-litiger)
- **Design : single-table** `Spot.kind` (enum `SpotKind {WATER_BODY|ACCESS_ZONE}`) + `Spot.parentId`
  (relation self `SpotHierarchy` parent/children, `onDelete: SetNull`). Choisi vs un modèle `AccessZone`
  séparé : additif, zéro casse des ~50k spots / FK (catches/reviews/favorites) / tuiles PostGIS / URLs `/spots/[slug]`.
- **SEO** : les pages `explore/[department]`, `[commune]`, `sitemap.ts` ne listent que **WATER_BODY** (éviter de noyer le SEO avec des jetées techniques). Les accès s'affichent sur la fiche du plan d'eau parent.
- **Pas de backfill 50k** : la colonne `kind NOT NULL DEFAULT 'WATER_BODY'` a été ajoutée en métadonnée-seule (PG15) → les 53 738 spots sont déjà `WATER_BODY`. La reclassification des accès = slice 3, **séparée et réversible**.
- **`PrivateSpot.spotId`** (rattachement waypoint→plan d'eau) = **différé** (slice 6, optionnel). Ne PAS fusionner PrivateSpot dans Spot (risque de fuite de coordonnées).

## AVANCEMENT
- ✅ **Slice 0 — migration additive (commit `a89b3b1`)** : `enum SpotKind`, `Spot.kind` (NOT NULL DEFAULT WATER_BODY), `Spot.parentId`, relation self `SpotHierarchy`, index `kind`/`parentId`/`status,kind,parentId`, FK `spots_parentId_fkey`. Appliquée à la prod Neon via `prisma db execute` (fichier `prisma/migrations/20260619140000_add_spot_kind_hierarchy/migration.sql`). Vérifié : 53 738 spots = WATER_BODY, colonnes/index/FK présents. `prisma generate` + `tsc` OK. **No-op fonctionnel** (aucun code ne lit `kind`).
- ✅ **Slice 1 — types & lecture passive (commit `4f34501`)** : `kind: SpotKind` + `parentId: string | null` ajoutés à `SpotListItem` (hérité par `SpotDetail`), `spotListSelect` (`kind/parentId: true`), et les SELECT raw PostGIS tuiles (`s."kind"::text`, `s."parentId"`) + bbox. `tsc` a aussi forcé 3 constructions manuelles de `SpotListItem`/`SpotDetail` à projeter les champs : fiche `spots/[slug]/page.tsx` + 2 pages SEO `explore/[department]/(page|[commune]/page).tsx`. **7 fichiers**, aucun filtre par défaut ni UI. Vérifié : `tsc` 0, eslint 0 (1 warning pré-existant `DEPARTMENTS`), vitest 257✓, + runtime Neon (SELECT typé + raw OK, 53 738 = WATER_BODY / 0 ACCESS_ZONE → no-op).
- ⏳ **Slices 2→6 — à faire** (détail ci-dessous). **Prochaine = slice 2** (filtre `kind` + défaut WATER_BODY dans `spot-filter-params`/`spot-where`/`spot-where-sql`/`spot.schema` + filtre SEO `explore/*`+`sitemap.ts`).

## SLICES RESTANTES (rétro-compatibles, ≤ ~6 fichiers chacune, zéro régression)

**Slice 1 — Types & lecture passive de `kind` (no UI change).**
Exposer `kind: SpotKind` + `parentId` dans `src/types/spot.ts`, `src/lib/spot-list-select.ts`, et le SELECT raw des tuiles/bbox (`s."kind"::text`). Aucun filtre par défaut encore. Fichiers : `types/spot.ts`, `spot-list-select.ts`, `api/spots/tiles/[z]/[x]/[y]/route.ts`, `api/spots/bbox/route.ts` (≤4).

**Slice 2 — Filtre `kind` + défaut WATER_BODY (carte/liste/SEO).**
Ajouter `kind` au vocabulaire partagé : `spot-filter-params.ts`, `spot-where.ts`, `spot-where-sql.ts`, `spot.schema.ts`. **Défaut carte+liste = WATER_BODY** (les ACCESS_ZONE n'apparaissent que si demandé / à fort zoom). Filtrer **WATER_BODY** sur les pages SEO `explore/*` + `sitemap.ts`. Tant qu'aucun spot n'est ACCESS_ZONE, no-op visuel. Test sur le défaut. Fichiers ≤6.
> Astuce filtre : `kind = 'WATER_BODY'` suffit (tous le sont), mais prévoir `kind IS DISTINCT FROM 'ACCESS_ZONE'` si on veut tolérer d'éventuels NULL futurs.

**Slice 3 — Reclassification data des accès (DB + script, réversible).**
Heuristique `osmTags` → `kind='ACCESS_ZONE'` (`man_made=pier`, `leisure=slipway`, `amenity=parking`…) + résolution `parentId` par proximité PostGIS (`ST_DWithin`, seuil strict, `parentId` NULL si ambigu). **Réversible** (`UPDATE ... SET kind='WATER_BODY', parentId=NULL`). Recoupe la dette dédup MED. Pas de fichier UI. Via `prisma db execute`/script.

**Slice 4 — Affichage niveau 2 (carte + fiche).**
Sous-couche « accès/parking/mise à l'eau » à fort zoom (carte) ; bloc « Accès publics » sur la fiche d'un WATER_BODY (liste ses `children`) ; bandeau « Cet accès appartient à [plan d'eau] » sur la fiche d'une ACCESS_ZONE. Fichiers : `SpotDetail.tsx`, `SpotLayer.tsx`/`MapContainer.tsx`, 1 composant, `spots/[slug]/page.tsx` (≤5).

**Slice 5 — Création / ingestion kind-aware.**
`SpotForm` propose le niveau ; `osm-ingestion.service.ts` pose `kind` à la création (pier/slipway/parking → ACCESS_ZONE) + tente `parentId`. Fichiers : `SpotForm`, `api/spots/route.ts POST`, `osm-ingestion.service.ts`, `spot.schema.ts` (≤4).

**Slice 6 — Rattachement waypoint privé (OPTIONNEL, différé).**
Migration M2 : `ALTER TABLE "private_spots" ADD COLUMN IF NOT EXISTS "spotId" TEXT;` + FK `private_spots_spotId_fkey` (SetNull) + index. Schéma `PrivateSpot.spotId String? @relation`. UI « rattacher à un plan d'eau » dans `PrivateSpotForm`. **Migration = orchestrateur** (méthode ci-dessous). Fichiers ≤4.

## MÉTHODE MIGRATION (orchestrateur, pas l'agent) — drift schéma↔migrations
`DATABASE_URL` = **Neon PROD** (pas de Postgres local). **NE PAS `prisma migrate dev`** (embarque le drift CRITICAL documenté). À la place : (1) éditer `schema.prisma`, (2) fichier `prisma/migrations/<ts>_<nom>/migration.sql` **idempotent** (`IF NOT EXISTS`, `DO $$ ... EXCEPTION WHEN duplicate_object`), (3) `npx prisma db execute --file <sql>` (lit l'URL non-pooler via `prisma.config.ts`→`getMigrationDatabaseUrl`, **sans** `--schema` en Prisma 7), (4) vérifier en base (`information_schema`/counts via tsx+pg sur `getMigrationDatabaseUrl()`), (5) `npx prisma generate`, (6) `tsc`. Pour les colonnes : préférer `NOT NULL DEFAULT <const>` (métadonnée-seule sur PG11+, pas de réécriture).

## VÉRIFICATION (l'orchestrateur lance ; les subagents n'ont PAS le shell)
À chaque slice : `npx tsc --noEmit`, `npx eslint <fichiers>`, `npx vitest run`, + runtime sur le dev server `localhost:3000` (vraie base Neon). **⚠ Caveat `kind`** : le dev server tourne avec un **client Prisma singleton en mémoire** ; après un `prisma generate`, les requêtes `select: { kind }` typées échouent en runtime tant que `npm run dev` n'est pas redémarré. Pour vérifier une requête `kind` sans toucher au serveur de l'utilisateur : script tsx ponctuel utilisant le client fraîchement régénéré (ex. `prisma.spot.findMany({ select: { kind: true }, take: 1 })`). Le SQL brut des tuiles/bbox (`$queryRaw`) n'est PAS concerné (pas de validation DMMF).

## RÈGLES DE TRAVAIL (cf. [[spot-experience-architect]] + CLAUDE.md)
- **Une slice à la fois**, ≤ ~6 fichiers, no-op-first (slices 1-2 avant de toucher la data en 3). Zéro régression à chaque étape : les ~50k spots, URLs `/spots/[slug]`, tuiles MVT, Explorer, SEO doivent continuer à marcher.
- **Pièges lint récurrents à éviter** : pas de `setState` synchrone dans `useEffect` ; apostrophes JSX typographiques `'` (jamais `'` en texte JSX nu) ; deps de hooks correctes ; aucun import inutilisé. (Re-vérifier soi-même avant de rendre.)
- Tests purs sous `tests/unit/**`. Tokens design réels (`globals.css`). Copie FR. A11y. Zéro `any` en lignes neuves.
- Filtres centralisés : `kind` doit passer par `spot-filter-params.ts` / `spot-where.ts` / `spot-where-sql.ts` (convergence déjà acquise — un seul point par couche).

## RISQUES (et mitigations)
1. **Tuiles/bbox raw SQL PostGIS** : `geometry` couvre les 2 niveaux ; ajouter juste `s."kind"` + filtre optionnel. Ne pas casser `ST_Intersects`.
2. **Oubli de filtrer `kind`** → les accès polluent la vue par défaut : défaut WATER_BODY dans le builder partagé + test.
3. **URLs/slugs** : un seul espace `/spots/[slug]` (pas de `/acces/[slug]`). Les 5000 slugs `sitemap.ts` restent valides.
4. **Auto-découverte** : `externalId` unique inchangé (idempotence imports). `kind` posé à la création en slice 5.
5. **Fuite coordonnées niveau 3** : `PrivateSpot` reste hors tuiles/bbox/SEO ; rattachement `spotId` unidirectionnel (waypoint→plan d'eau).
6. **Backfill prod** (si slice 3 lourde) : batcher, snapshot Neon préalable, réversible.

## Fichiers critiques
`prisma/schema.prisma` · `src/lib/spot-where-sql.ts` (raw SQL tuiles+bbox) · `src/lib/spot-where.ts` + `src/validators/spot.schema.ts` (liste) · `src/lib/spot-filter-params.ts` · `src/lib/spot-list-select.ts` · `src/types/spot.ts` · `src/components/spots/SpotDetail.tsx` + `src/app/(main)/spots/[slug]/page.tsx` · `src/components/map/{SpotLayer,MapContainer}.tsx` · `src/services/osm-ingestion.service.ts` · pages SEO `src/app/(main)/explore/*` + `src/app/sitemap.ts`.
