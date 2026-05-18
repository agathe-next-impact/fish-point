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

### Migrer le stockage des images R2 → Vercel Blob
- **Fichiers** : `src/lib/r2.ts`, vars `R2_*` dans `src/lib/env.ts`
- **Constat** : les images de spots sont stockées sur Cloudflare R2 (bucket `fishspot-images`). Pendant la migration Mapbox→MapLibre, on a fait le choix de Vercel Blob pour les PMTiles afin de garder un seul vendeur. Les images restent sur R2 pour ne pas alourdir le chantier.
- **Impact** : 2 vendeurs de stockage à gérer (R2 + Blob), 2 jeux de secrets, 2 dashboards. Cohérence imparfaite.
- **Fix proposé** : ré-écrire `src/lib/r2.ts` sur `@vercel/blob` (upload/delete identiques), migrer les URLs existantes dans la DB (script de batch update), retirer les vars `R2_*`. À mesurer côté coût avant d'attaquer : R2 a 0 $ d'egress, Vercel Blob facture au-delà du pool inclus → si le trafic images dépasse 100 Go/mois (Hobby) ou 1 To/mois (Pro), garder R2.
- **Quand** : à programmer après ML-07 (clôture migration carto), pas urgent.
- **Détecté** : 2026-05-18

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

## Resolved (archive 30 jours avant suppression)
