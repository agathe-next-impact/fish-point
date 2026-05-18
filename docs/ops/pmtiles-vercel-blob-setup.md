# Runbook — Hébergement PMTiles sur Vercel Blob

> Procédure ML-01 de la migration Mapbox → MapLibre.
> Voir `docs/migration-maplibre.md` pour le contexte complet.

Objectif : héberger un fichier `france.pmtiles` (~300–500 Mo) sur Vercel Blob, accessible publiquement, avec support natif des Range requests et un cache long. Aucun service externe à Vercel.

---

## Pourquoi Vercel Blob plutôt que R2 ?

- **Un seul vendeur** : facturation, dashboard, secrets — tout reste sur Vercel.
- **CORS et Range requests automatiques** : pas de configuration manuelle, contrairement à R2.
- **Coût** : stockage ~0,01 $/mois pour 500 Mo. Le bandwidth est compté dans le pool "Fast Origin Transfer" inclus dans ton plan Vercel (100 Go/mois Hobby, 1 To Pro) — au volume de trafic actuel, surcoût marginal nul.

> ⚠️ Le bucket R2 `fishspot-images` reste en place pour les uploads photo. Sa migration vers Blob est trackée comme dette technique (`docs/tech-debt.md`).

---

## Prérequis

- Compte Vercel avec ce projet déployé (déjà le cas)
- CLI Vercel installée : `npm i -g vercel` puis `vercel link` à la racine du projet

---

## 1. Création du store Blob (dashboard, ~1 min)

1. Aller sur https://vercel.com/dashboard → projet `fish-point` → onglet **Storage**
2. Cliquer **Create Database** → choisir **Blob**
3. Nom : `fishspot-tiles` (ou laisser le défaut)
4. Region : laisser le défaut (auto)
5. Cliquer **Create**

Vercel ajoute automatiquement le secret `BLOB_READ_WRITE_TOKEN` aux variables d'env du projet (Development, Preview, Production).

## 2. Récupération du token en local (~30 sec)

```bash
vercel env pull .env.local
```

Cette commande pull toutes les vars Vercel vers `.env.local`, dont `BLOB_READ_WRITE_TOKEN`. Vérifier sa présence :

```bash
grep BLOB_READ_WRITE_TOKEN .env.local
```

## 3. Installation de la lib Blob (~10 sec)

```bash
npm install @vercel/blob
```

## 4. Récupération de l'extrait France (~5–10 min)

> ⚠️ L'**UI app.protomaps.com ne supporte pas un polygone aussi grand que la France entière** (limite de taille/complexité côté frontend Protomaps). Il faut passer par la CLI `pmtiles extract` qui lit directement le planet quotidien via Range requests — seules les tuiles France sont rapatriées (~300–500 Mo), pas le planet de 100 Go.

Trois variantes au choix (le résultat est identique).

### Option A — Docker (recommandé, multi-plateforme)

Docker est déjà dans la stack (`docker compose up -d` pour Postgres+Redis). Depuis la racine du projet :

**Bash / Git Bash :**
```bash
mkdir -p tiles
# Date J-2 UTC pour être sûr que le build planet est publié
PLANET_DATE=$(date -u -d '2 days ago' +%Y%m%d)
docker run --rm -v "$PWD/tiles:/data" protomaps/go-pmtiles:latest \
  extract "https://build.protomaps.com/${PLANET_DATE}.pmtiles" \
  /data/france.pmtiles \
  --bbox=-5.5,41.3,9.7,51.2
```

**PowerShell :**
```powershell
mkdir tiles -ErrorAction SilentlyContinue
$planetDate = (Get-Date).ToUniversalTime().AddDays(-2).ToString("yyyyMMdd")
docker run --rm -v "${PWD}/tiles:/data" protomaps/go-pmtiles:latest `
  extract "https://build.protomaps.com/$planetDate.pmtiles" `
  /data/france.pmtiles `
  --bbox=-5.5,41.3,9.7,51.2
```

Durée typique : 3–8 min selon la bande passante. La progression s'affiche en live.

### Option B — Binaire Go natif (sans Docker)

1. Télécharger le binaire Windows depuis https://github.com/protomaps/go-pmtiles/releases (ex. `go-pmtiles_x.y.z_Windows_x86_64.zip`)
2. Dézipper, placer `pmtiles.exe` dans un dossier du `PATH` (ex. `C:\Users\agath\bin\`)
3. Exécuter :

```powershell
mkdir tiles -ErrorAction SilentlyContinue
$planetDate = (Get-Date).ToUniversalTime().AddDays(-2).ToString("yyyyMMdd")
pmtiles extract "https://build.protomaps.com/$planetDate.pmtiles" `
  tiles\france.pmtiles `
  --bbox=-5.5,41.3,9.7,51.2
```

### Option C — Déclencher le workflow GitHub Action (zéro install local)

Si le repo est poussé sur GitHub et que le secret `BLOB_READ_WRITE_TOKEN` est ajouté côté Actions, le workflow `.github/workflows/update-tiles.yml` peut être déclenché manuellement et fait **à la fois l'extract et l'upload Blob**. Tu peux donc sauter les étapes 4 et 5 entièrement :

```bash
gh workflow run update-tiles.yml
gh run watch
```

Le workflow tourne ensuite tous les 1ers du mois pour garder les tuiles à jour.

> Le bbox `-5.5,41.3,9.7,51.2` couvre France métro + Corse. Pour ajuster (ex. inclure Andorre, Monaco), modifier la valeur dans la commande et dans `.github/workflows/update-tiles.yml`.

## 5. Upload vers Vercel Blob (~1–3 min selon connexion)

Depuis la racine du projet, avec `.env.local` rempli :

```bash
npm run upload-tiles
```

Le script (`scripts/upload-pmtiles.ts`) :
- charge `./tiles/france.pmtiles`
- pousse vers Vercel Blob avec `access: 'public'`
- pose `cacheControlMaxAge: 31536000` (1 an, immutable)
- affiche l'URL publique générée

Exemple de sortie :
```
URL: https://abcd1234.public.blob.vercel-storage.com/france.pmtiles
```

## 6. Configuration de l'URL publique (~1 min)

Récupérer la base URL (sans `/france.pmtiles`) et la définir comme variable d'env Vercel **et** locale :

```bash
# Local
echo 'NEXT_PUBLIC_PMTILES_URL="https://abcd1234.public.blob.vercel-storage.com"' >> .env.local

# Vercel (les trois envs)
vercel env add NEXT_PUBLIC_PMTILES_URL preview
vercel env add NEXT_PUBLIC_PMTILES_URL production
vercel env add NEXT_PUBLIC_PMTILES_URL development
```

Côté mobile, ajouter `EXPO_PUBLIC_PMTILES_URL` avec la même valeur dans `mobile/.env` (ou `mobile/app.json` selon ton setup).

## 7. Vérifications (acceptance criteria ML-01)

```bash
# 1. Range requests OK (Vercel Blob les supporte nativement)
curl -I --range 0-1000 "$NEXT_PUBLIC_PMTILES_URL/france.pmtiles"
# Attendu : HTTP/2 206, accept-ranges: bytes, cache-control: public, max-age=31536000, immutable

# 2. Taille fichier cohérente
curl -sI "$NEXT_PUBLIC_PMTILES_URL/france.pmtiles" | grep -i content-length

# 3. CORS (pas besoin de config — Vercel Blob répond avec Access-Control-Allow-Origin: * par défaut)
curl -I -H "Origin: http://localhost:3000" "$NEXT_PUBLIC_PMTILES_URL/france.pmtiles"
# Attendu : access-control-allow-origin: *
```

Si les 3 vérifications passent → **ML-01 est validé**, ML-02 et ML-08 peuvent démarrer.

---

## Maintenance (refresh mensuel)

Les données Protomaps sont reconstruites quotidiennement depuis OpenStreetMap. Pour rester à jour :

1. **Manuel** : refaire les étapes 4 + 5 tous les ~30 jours (5 min)
2. **Automatique** : activer le workflow `.github/workflows/update-tiles.yml` (cron mensuel + manuel via `workflow_dispatch`). Secret GitHub requis : `BLOB_READ_WRITE_TOKEN` (copier depuis `.env.local`).

## Rollback

Si Vercel Blob est cassé ou indisponible, l'application bascule automatiquement sur Mapbox tant que `NEXT_PUBLIC_MAP_PROVIDER=mapbox`. Pour forcer le rollback en prod :
1. Vercel dashboard → Settings → Environment Variables
2. Passer `NEXT_PUBLIC_MAP_PROVIDER` à `mapbox`
3. Redéployer

## Coûts attendus

- Stockage Blob : 500 Mo × 0,023 $/Go/mois ≈ **0,01 $/mois**
- Bandwidth : compté dans le pool Fast Origin Transfer du plan Vercel (100 Go/mois inclus Hobby, 1 To Pro). Au trafic actuel : **0 $ marginal**.

Premier ordre de grandeur : **négligeable**.

## Limites à connaître

- Vercel Blob facture le bandwidth au-delà du pool inclus (0,15 $/Go au-delà sur Pro). Si le trafic explose et qu'on dépasse 1 To/mois en bandwidth tuiles, R2 deviendrait plus économique (egress gratuit chez Cloudflare). À surveiller dans le dashboard Vercel Usage. Seuil de bascule indicatif : > 100 000 utilisateurs uniques/mois sur la carte.
