# Projet — fish-point

> Application web + mobile dédiée à la pêche en France. Cartographie de spots, journal de captures, communauté, abonnements premium, alertes météo/hydrologie, réglementation par département.
>
> Ce fichier est chargé automatiquement par Claude Code au démarrage d'une session.

## Mode de fonctionnement

Mode **legacy-friendly** par défaut :

1. **Audit = diff courant** par défaut. Audit global uniquement sur `/audit-global`.
2. **Boy Scout Rule** : code nouvellement ajouté = conventions cibles. Code modifié = amélioration locale sans cascade. Code non touché = laissé tranquille.
3. **Dette technique trackée** : voir `/docs/tech-debt.md`. Alimenté par l'agent `tech-debt-tracker`.
4. **Nouveautés = cible stricte** : tout nouveau fichier, route, endpoint, composant respecte les conventions cibles.

## 1. Stack

| Couche | Technologie | Version | Notes |
| --- | --- | --- | --- |
| Runtime | Node | 20 (CI) | `.nvmrc` absent, lock via workflows GitHub Actions |
| Package manager | npm | (lockfile v3) | workspaces npm racines : `shared` |
| Langage | TypeScript | ^5 | mode strict : **oui** (`tsconfig.json`) |
| Framework web | Next.js | 16.1.6 | **App Router** (`src/app/`), Server Actions activés |
| React | | 19.2.3 | |
| Styling | Tailwind CSS | 4 | via `@tailwindcss/postcss`, pas de `tailwind.config` |
| UI primitives | Radix UI | divers | + composants maison `src/components/ui/` |
| ORM | Prisma | ^7.4 | client + driver `@prisma/adapter-pg` |
| Database | PostgreSQL + PostGIS | 16-3.4 (dev) | Neon en prod (`DATABASE_URL`), géospatial via PostGIS |
| Auth | NextAuth | ^5.0.0-beta.30 | Prisma adapter + Google OAuth + bcryptjs (mobile) |
| Storage objets | Cloudflare R2 | via `@aws-sdk/client-s3` | bucket `fishspot-images` |
| Cache / rate-limit | Upstash Redis | `@upstash/redis` + `@upstash/ratelimit` | |
| Paiements | Stripe | ^20 | abonnements premium |
| Emails | Resend | ^6.9 | |
| Cartographie | MapLibre GL JS + react-map-gl | ^5.24 / ^8.1 | clustering via `supercluster`, tuiles PMTiles hébergées sur Vercel Blob, fond satellite IGN WMTS — migration depuis Mapbox tracée dans `docs/migration-maplibre.md` |
| State client | Zustand + TanStack Query | ^5 / ^5.90 | |
| Formulaires | react-hook-form + zod | ^7.71 / ^4.3 | resolvers `@hookform/resolvers` |
| Tests unit | Vitest | ^4 | jsdom, ~3 fichiers unit existants |
| Tests E2E | Playwright | ^1.58 | 3 specs : auth, map, spot creation |
| App mobile | Expo + React Native | ~55 / 0.83 | dossier `mobile/` (workspace propre, pas dans le root npm) |
| Shared types | workspace `@fish-point/shared` | | types partagés web ↔ mobile |
| CI | GitHub Actions | | `.github/workflows/ci.yml` + `deploy.yml` |
| Hosting | Vercel | | + Vercel Crons (`vercel.json`) |
| Bundle analyzer | `@next/bundle-analyzer` | | `npm run analyze` |

## 2. Structure du repo

```
fish-point/
├── src/
│   ├── app/
│   │   ├── (auth)/              # login, register
│   │   ├── (main)/              # routes utilisateur (alerts, catches, community, dashboard, explore, map, my-spots, profile, regulations, spots)
│   │   └── api/
│   │       ├── auth/            # NextAuth + mobile-login + register + push-token
│   │       ├── catches/         # CRUD captures + sync offline + share
│   │       ├── cron/            # 11 endpoints cron (Vercel Crons + bearer CRON_SECRET)
│   │       ├── dashboard/       # stats agrégées (espèces, appâts, météo, progression)
│   │       ├── feed/, groups/, fishing-cards/, alerts/, regulations/
│   │       ├── private-spots/, spots/  # spots privés vs publics
│   │       ├── identify-fish/   # Google Cloud Vision
│   │       ├── upload/          # R2
│   │       ├── water/, weather/ # Hubeau + OpenWeatherMap
│   │       └── webhooks/stripe/
│   ├── components/              # ui, layout, map, spots, catches, community, dashboard, alerts, profile, providers, regulations, private-spots
│   └── lib/                     # auth, prisma, r2, redis, resend, stripe, mapbox, mobile-auth, env, rate-limit, offline-db, utils, constants
├── prisma/
│   ├── schema.prisma            # PostgreSQL + PostGIS + fullTextSearch
│   ├── migrations/              # 6 migrations dont `add_performance_indexes`
│   └── seed.ts                  # exclu du tsconfig
├── shared/                      # workspace npm — types partagés mobile/web
│   ├── constants/, types/
│   └── package.json             # @fish-point/shared
├── mobile/                      # Expo + RN, workspace indépendant (pas dans root npm)
│   └── src/{api,hooks,stores,theme,utils}/
├── tests/
│   ├── e2e/                     # Playwright
│   ├── unit/                    # Vitest
│   └── setup.ts
├── scripts/                     # enrich-fishbase, generate-sitemap, seed-spots, sync-regulations
├── public/                      # manifest.json (PWA)
├── docs/                        # tech-debt.md, ops/runbook.md, overlays.md
├── .github/workflows/           # ci.yml + deploy.yml
├── .claude/                     # kit Claude Code (agents, commands, settings)
├── docker-compose.yml           # postgis + redis (dev local)
├── vercel.json                  # 6 crons
├── next.config.mjs              # bundle analyzer + headers + remote images
└── eslint.config.mjs            # eslint-config-next vitals + ts
```

## 3. Conventions du projet

### Telles qu'elles sont (état observé)

- **TypeScript** : `strict: true` activé. `seed.ts` et `mobile/`, `shared/` exclus du tsconfig web.
- **Style** : ESLint via `eslint-config-next` (core-web-vitals + typescript). Pas de Prettier explicite.
- **Commits** : **libres, francophones**, souvent courts (`PRISE FIX`, `perfs`, `fix clignotement des points`, `v1.2`, `mobile`). Pas de Conventional Commits.
- **Branches** : trunk-based sur **`master`** (pas de `develop` actif). ⚠ Voir dette critique : workflows CI ciblent `main`/`develop`.
- **Tests** : couverture très partielle (3 unit + 3 e2e). Pas de seuil enforced.
- **Validation** : Zod déjà utilisé (forms, `lib/env.ts`, schemas). À généraliser aux frontières d'API.
- **Auth mobile** : routes `/api/auth/mobile-login` + `mobile-register` + `push-token` — token bearer manuel (pas NextAuth pour mobile).

### Cibles (pour tout nouveau code)

- TypeScript strict : zéro `any` en green lines, signatures explicites sur fonctions exportées.
- Validation Zod aux frontières (route handlers, server actions, ingestion externe).
- Tests sur tout nouveau flow critique (préférer Vitest unit + Playwright pour les parcours).
- Commits explicites, message descriptif (FR ou EN, libre — mais qui décrit le changement).
- Accessibilité WCAG 2.2 AA sur composants UI Radix.
- Pas de secret en clair, secrets via `.env` (gitignored), validés via `lib/env.ts`.
- Endpoints cron : protection bearer `CRON_SECRET`.

## 4. Commandes du projet

```bash
# Dev (lance Next.js sur :3000)
npm run dev

# Build (génère le client Prisma puis next build)
npm run build

# Start (prod local)
npm run start

# Lint
npm run lint

# Bundle analyzer
npm run analyze

# Typecheck (pas de script dédié — utiliser)
npx tsc --noEmit

# Tests unit
npx vitest run

# Tests E2E (lance le dev server automatiquement)
npx playwright test

# DB locale
docker compose up -d            # Postgis + Redis sur :5433 / :6379
npx prisma migrate dev
npx prisma generate
npx tsx prisma/seed.ts          # seed
```

## 5. Variables d'environnement

Source : `.env` (gitignored, jamais committé). Pas de `.env.example` versionné — **à créer** (cf. dette).

**Indispensables** :
- `DATABASE_URL` — Postgres (Neon en prod)
- `NEXT_PUBLIC_PMTILES_URL` — URL publique du bucket Vercel Blob hébergeant `france.pmtiles`
- `BLOB_READ_WRITE_TOKEN` — write token Vercel Blob (auto-provisionné via `vercel env pull`)
- `AUTH_SECRET` — NextAuth (`openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth Google
- `CRON_SECRET` — bearer protection des endpoints `/api/cron/*`

**Secondaires** :
- `NEXT_PUBLIC_APP_URL` (défaut `http://localhost:3000`)
- R2 : `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `NEXT_PUBLIC_R2_PUBLIC_URL`
- Upstash : `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Stripe : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PREMIUM_PRICE_ID`
- Resend : `RESEND_API_KEY`
- APIs externes : `OPENWEATHERMAP_API_KEY`, `UNSPLASH_ACCESS_KEY`, `GOOGLE_CLOUD_VISION_API_KEY` (géocodage via BAN `api-adresse.data.gouv.fr`, sans clé)
- Hubeau : `HUBEAU_BASE_URL` (défaut `https://hubeau.eaufrance.fr/api`)
- Mobile : `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_PROJECT_ID`

Validation runtime via `src/lib/env.ts` (Zod).

## 6. Règles impératives pour Claude

1. **Audit = diff courant** par défaut. Audit global uniquement sur `/audit-global`.
2. **Nouveau code respecte la cible**. Pas de justification "pour rester cohérent avec l'existant".
3. **Code modifié** : Boy Scout Rule — amélioration locale si faisable sans cascade.
4. **Ne jamais désactiver silencieusement** un test, un type check, un lint rule. Toujours expliquer.
5. **Dette détectée hors scope** : noter dans `/docs/tech-debt.md`, ne pas bloquer la PR.
6. **Critical findings** (secret en clair tracké, faille avérée) : **toujours signalés** même hors scope.
7. **Secrets** : jamais committés. `.env*` gitignored (vérifié). `git ls-files` ne renvoie aucun fichier `.env`.
8. **Commits** : message clair (FR ou EN). Le projet n'impose pas Conventional Commits — rester pragmatique.
9. **Branche par défaut = `master`**. ⚠ Les workflows CI/CD ciblent `main`/`develop` (voir dette critique).
10. **Cron endpoints** : tout nouvel endpoint `/api/cron/*` doit vérifier `Authorization: Bearer ${CRON_SECRET}`.
11. **Mobile/web partage** : types communs dans `shared/`, ne pas dupliquer dans `mobile/src/types/` ou `src/types/`.

## 7. Subagents disponibles

Voir `.claude/agents/`. Catégories :

- **engineering** — TypeScript, DevOps, frontend
- **performance** — Core Web Vitals, bundle, cache
- **design** — UI, accessibilité, design system
- **security** — secrets, validation, headers, supply chain
- **testing** — stratégie de tests, E2E
- **project-management** — sprint, release, dette technique

## 8. Slash-commands disponibles

- `/onboard` — audit initial (déjà exécuté)
- `/review-pr` — revue multi-agent du diff
- `/audit-global` — audit global (opt-in, long)
- `/migrate-pattern` — migration incrémentale d'un pattern hérité vers cible
- `/release-check` — checklist pré-déploiement

## 9. Overlays

Aucun overlay stack-spécifique appliqué. La stack (Next.js + Prisma + Stripe + Mapbox + Expo) ne correspond à aucun overlay tout-fait listé. Si besoin un jour : créer `overlays/nextjs-prisma-saas` (Stripe + Prisma + Vercel Crons + R2). Voir `docs/overlays.md`.
