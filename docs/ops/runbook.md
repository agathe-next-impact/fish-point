# Runbook opérationnel

> État au 2026-04-26 (onboarding). À enrichir au premier incident.

## Stack hosting

- **Web** : Vercel (déploiement Git natif présumé — voir dette critique sur `deploy.yml`)
- **DB** : Neon (Postgres serverless, eu-central-1) — branche `neondb`
- **Cache / rate-limit** : Upstash Redis (REST)
- **Storage objets** : Cloudflare R2, bucket `fishspot-images`
- **Crons** : Vercel Crons (`vercel.json` — 6 jobs)
- **Auth provider externe** : Google OAuth
- **Paiements** : Stripe (webhook `/api/webhooks/stripe`)
- **Emails transactionnels** : Resend
- **App mobile** : Expo (build et publication via EAS — à confirmer)

## Comment lancer en local

```bash
# 1. DB + Redis
docker compose up -d

# 2. Variables d'env
cp .env.example .env       # à créer (cf. tech-debt)
# remplir les valeurs

# 3. DB schema
npx prisma migrate dev
npx prisma generate

# 4. Seed (optionnel)
npx tsx prisma/seed.ts

# 5. Dev server
npm run dev
# → http://localhost:3000
```

## Comment redémarrer l'app en prod

- **Vercel** : redeploy manuel via dashboard Vercel (`Deployments → ... → Redeploy`) ou push sur `master`.
- **Pas de process à redémarrer côté Neon ou Upstash** (services managés).

## Comment rollback un déploiement

- **Vercel** : `Deployments` → choisir le déploiement précédent → `Promote to Production`.
- **Migration DB problématique** : pas de rollback automatique Prisma. Procédure manuelle :
  1. Identifier la migration fautive dans `prisma/migrations/`
  2. Écrire une migration inverse (DROP, ALTER reverse, etc.)
  3. `npx prisma migrate deploy` en pointant vers Neon avec `DATABASE_URL`
  4. **Backup Neon** : prendre un snapshot Neon avant toute migration risquée

## Comment lire les logs en prod

- **Vercel** : `Deployments → [deploy] → Functions` ou onglet `Logs`. Logs des Server Components, route handlers, server actions.
- **Logs cron** : `Logs` → filtrer par path `/api/cron/*`.
- **Erreurs runtime** : pas de Sentry / Datadog configuré → tout passe par Vercel logs (rétention limitée).

## Comment restore la DB depuis un backup

- **Neon** : utiliser les **branches Neon** (point-in-time recovery jusqu'à 7 jours sur free tier, 30+ sur paid).
  1. Dashboard Neon → projet → `Branches` → `Create branch from point in time`
  2. Tester la branche restaurée
  3. Si OK : promouvoir la branche restaurée comme primaire OU dump + restore vers la primaire

## Endpoints cron actifs (Vercel Crons)

| Path | Schedule | Rôle |
| --- | --- | --- |
| `/api/cron/refresh-scores` | `*/30 * * * *` | recalcul scores fishability |
| `/api/cron/refresh-static-scores` | `0 3 * * *` | scores statiques nuit |
| `/api/cron/sync-water-levels` | `0 */2 * * *` | hydrologie Hubeau |
| `/api/cron/ingest-spots` | `0 2 * * 0` | ingestion spots dimanche 2h |
| `/api/cron/enrich-spots` | `0 4 * * 1` | enrichissement spots lundi 4h |
| `/api/cron/link-stations` | `0 5 * * 0` | lien spots ↔ stations dimanche 5h |

> Il existe aussi des endpoints cron côté code non déclarés dans `vercel.json` : `card-expiry-reminders`, `compute-alerts`, `ingest-osm`, `sync-regulations`, `sync-vigieau`. Vérifier s'ils sont planifiés ailleurs (cron externe ?) ou si la config `vercel.json` est incomplète.

Tous les cron endpoints **doivent** vérifier `Authorization: Bearer ${CRON_SECRET}`.

## Webhooks externes

- **Stripe** : `/api/webhooks/stripe` — signature vérifiée via `STRIPE_WEBHOOK_SECRET`. Configurer l'URL dans dashboard Stripe.

## Contacts d'urgence

_(à remplir par l'équipe — solo dev pour l'instant)_

## Incidents récents

_(aucun documenté)_
