# Overlays appliqués

> Ce kit est universel. Aucun overlay stack-spécifique n'est appliqué pour le moment.
>
> Overlays disponibles (à créer / installer séparément selon besoins) :
> - `nextjs-payload` — Next.js + Payload + Stripe + Mapbox
> - `astro-payload` — Astro + Payload headless
> - `wp-nextjs` — WordPress Headless + Next.js
> - `medsite-saas` — Multi-tenant + RGPD santé + HDS
> - `payload-legacy` — Mode diff-scoped pour projet Payload existant

## Appliqués
_(aucun)_

## Recommandation issue de l'onboarding (2026-04-26)

La stack détectée — **Next.js 16 (App Router) + Prisma + PostGIS (Neon) + Stripe + R2 + Mapbox + Vercel Crons + Expo mobile partagée via workspace `shared/`** — ne correspond à aucun overlay tout fait :
- ❌ pas Payload CMS (Prisma direct)
- ❌ pas WordPress
- ❌ pas multi-tenant santé / HDS
- ❌ pas projet legacy en migration

**Décision** : rester en **kit universel**. Si le besoin se précise un jour, candidat naturel : un overlay maison `nextjs-prisma-saas` qui ajouterait des agents pour :
- Stripe (webhooks, idempotence, gestion abonnements)
- Vercel Crons (bearer auth, idempotence, monitoring)
- Postgres + PostGIS (migrations, requêtes géospatiales, indexes)
- Cloudflare R2 (presigned URLs, cleanup)
- App mobile partagée (Expo + types `shared/`)

## Historique d'application
_(aucun)_
