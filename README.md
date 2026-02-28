This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Prérequis

- Node.js 18+
- Docker (pour la base de données PostgreSQL + PostGIS)

## Installation

```bash
npm install
```

## Configuration des variables d'environnement

Copiez le fichier `.env` d'exemple et renseignez vos valeurs :

```bash
cp .env .env.local
```

### Variables requises

| Variable | Description | Comment l'obtenir |
|---|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL | Voir section [Base de données](#base-de-données) |
| `AUTH_SECRET` | Clé secrète pour Auth.js (sessions/JWT) | `npx auth secret` ou `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | ID client OAuth Google | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Secret client OAuth Google | Même console que ci-dessus |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Token public Mapbox (carte) | [Mapbox Account](https://account.mapbox.com/access-tokens/) |

### Variables optionnelles

| Variable | Service | Usage |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis | Cache et rate limiting |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare R2 | Stockage d'images |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe | Paiements premium |
| `OPENWEATHERMAP_API_KEY` | OpenWeatherMap | Conditions météo |
| `RESEND_API_KEY` | Resend | Envoi d'emails |
| `PUSHER_APP_ID` / `PUSHER_KEY` / `PUSHER_SECRET` | Pusher | Notifications temps réel |
| `SENTRY_DSN` | Sentry | Monitoring d'erreurs |

## Base de données

Le projet utilise PostgreSQL avec l'extension PostGIS (données géographiques).

### Lancer PostgreSQL avec Docker

```bash
docker run -d \
  --name fishpoint-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=fishspot \
  -p 5432:5432 \
  postgis/postgis:16-3.4
```

### Appliquer le schema

```bash
npx prisma generate
npx prisma db push
```

### Commandes Prisma utiles

```bash
npx prisma studio    # Interface web pour explorer la base
npx prisma db seed   # Peupler la base avec des données de test
```

## Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
