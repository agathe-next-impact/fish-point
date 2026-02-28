# Procédure de déploiement Fish-Point

## Architecture

- **Hébergement** : Vercel (Next.js)
- **Base de données** : Neon PostgreSQL (free tier)
- **ORM** : Prisma 7 avec `@prisma/adapter-pg`

---

## 1. Créer la base de données Neon (gratuit)

### Free tier inclus
- 0.5 Go de stockage par branche
- 100 heures de compute/mois
- PostgreSQL 17 + PostGIS
- Auto-suspend (la base s'éteint après inactivité)

### Étapes

1. Aller sur [neon.com](https://neon.com) et créer un compte
2. Créer un nouveau projet :
   - **Name** : `fish-point`
   - **Region** : `AWS eu-central-1` (Francfort) pour la latence France
   - **PostgreSQL version** : 17
3. Activer l'extension PostGIS :
   - Dans la console SQL de Neon, exécuter :
     ```sql
     CREATE EXTENSION IF NOT EXISTS postgis;
     ```
4. Récupérer les deux connection strings depuis le dashboard :
   - **Pooled** (pour le runtime) : `postgresql://user:pass@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   - **Direct** (pour les migrations) : `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

---

## 2. Configurer les variables d'environnement sur Vercel

Aller dans **Vercel > Project > Settings > Environment Variables** et ajouter :

| Variable | Valeur | Environnements |
|---|---|---|
| `DATABASE_URL` | URL **pooled** de Neon | Production, Preview |
| `NEXTAUTH_URL` | `https://votre-domaine.vercel.app` | Production |
| `NEXTAUTH_SECRET` | Générer avec `openssl rand -base64 32` | Production, Preview |
| `AUTH_SECRET` | Même valeur que NEXTAUTH_SECRET | Production, Preview |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Votre token Mapbox public | Tous |
| `NEXT_PUBLIC_APP_URL` | `https://votre-domaine.vercel.app` | Production |
| `CRON_SECRET` | Générer avec `openssl rand -base64 32` | Production |

Les variables optionnelles (Stripe, Resend, etc.) peuvent être ajoutées plus tard.

---

## 3. Appliquer les migrations sur la base de production

Depuis votre machine locale, avec l'URL **directe** (non poolée) :

```bash
# Définir l'URL directe pour les migrations
export DATABASE_URL="postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Appliquer les migrations
npx prisma migrate deploy

# Vérifier que les tables sont créées
npx prisma studio
```

---

## 4. Seeder la base de production

```bash
# Toujours avec l'URL directe
export DATABASE_URL="postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Lancer le seed
npx tsx prisma/seed.ts
```

Cela va créer :
- 1 utilisateur demo
- 13 espèces de poissons (avec données FishBase)
- 65 spots de pêche répartis en France

---

## 5. Déployer sur Vercel

```bash
# Depuis la branche master
git add -A
git commit -m "Prepare for deployment"
git push origin master
```

Vercel va automatiquement :
1. Installer les dépendances (`npm install` → déclenche `postinstall: prisma generate`)
2. Builder (`prisma generate && next build`)
3. Déployer

---

## 6. Vérification post-déploiement

- [ ] La page d'accueil charge correctement
- [ ] La carte affiche les spots
- [ ] La page `/explore` liste les départements avec des spots
- [ ] Les pages spot individuelles (`/spots/[slug]`) affichent les données
- [ ] L'API `/api/spots/nearby?lat=45.75&lng=4.85&radius=50000` retourne des résultats

---

## Commandes utiles

```bash
# Ouvrir Prisma Studio sur la base de prod
DATABASE_URL="..." npx prisma studio

# Re-seeder (reset + seed)
DATABASE_URL="..." npx prisma migrate reset

# Voir les logs Vercel
vercel logs https://votre-domaine.vercel.app
```

---

## Notes

- **Auto-suspend Neon** : La base s'éteint après 5 min d'inactivité (free tier). Le premier appel après inactivité prend ~500ms de plus (cold start).
- **Pooled vs Direct** : Utilisez l'URL poolée (`-pooler`) pour `DATABASE_URL` sur Vercel (gère les connexions serverless). Utilisez l'URL directe uniquement pour `prisma migrate` depuis votre machine.
- **PostGIS** : Doit être activé manuellement sur Neon via `CREATE EXTENSION postgis` avant de lancer les migrations.
