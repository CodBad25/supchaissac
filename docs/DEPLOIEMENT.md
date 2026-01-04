# Guide de Déploiement - SupChaissac v2.0

## Architecture de production

```
┌─────────────────────────────────────────────────────────┐
│                    SCALEWAY                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │        Serverless Containers (Free Tier)        │    │
│  │  ┌─────────────────────────────────────────┐   │    │
│  │  │           Docker Container              │   │    │
│  │  │  ┌─────────┐    ┌──────────────────┐   │   │    │
│  │  │  │ Express │    │   React (Vite)   │   │   │    │
│  │  │  │ Backend │    │    Frontend      │   │   │    │
│  │  │  └────┬────┘    └──────────────────┘   │   │    │
│  │  └───────┼────────────────────────────────┘   │    │
│  └──────────┼────────────────────────────────────┘    │
│             │                                          │
│  ┌──────────▼──────────┐    ┌─────────────────────┐   │
│  │   Object Storage    │    │  Container Registry │   │
│  │   (S3 - Fichiers)   │    │   (Images Docker)   │   │
│  └─────────────────────┘    └─────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
          ┌─────────────────────────────┐
          │      NEON (PostgreSQL)      │
          │      Base de données        │
          └─────────────────────────────┘
```

---

## Prérequis

### Comptes requis

1. **Scaleway** (https://console.scaleway.com)
   - Serverless Containers
   - Object Storage (S3)
   - Container Registry

2. **Neon** (https://neon.tech)
   - Base de données PostgreSQL

### Outils locaux

```bash
# Docker
docker --version  # >= 20.0

# Scaleway CLI
scw version  # >= 2.0

# Node.js
node --version  # >= 18.0
```

---

## Configuration Scaleway

### 1. Créer un projet

```bash
# Se connecter à Scaleway
scw init

# Créer un projet (ou utiliser existant)
scw account project list
```

### 2. Créer le Container Registry

```bash
# Créer un namespace de registry
scw registry namespace create name=supchaissac region=fr-par

# Se connecter au registry
scw registry login
```

### 3. Créer le bucket S3

```bash
# Via la console Scaleway :
# Object Storage > Create bucket > "supchaissac"
# Région: fr-par
# Visibilité: Private
```

### 4. Créer les credentials S3

```bash
# Via la console Scaleway :
# IAM > API Keys > Create API Key
# Scope: Object Storage
```

---

## Configuration Neon

### 1. Créer la base de données

1. Connectez-vous à https://console.neon.tech
2. Create Project > "supchaissac"
3. Région: eu-central-1 (Frankfurt)
4. Copiez la connection string

### 2. Pousser le schéma

```bash
# Configurer DATABASE_URL
export DATABASE_URL="postgresql://..."

# Pousser le schéma
npm run db:push
```

---

## Déploiement

### 1. Variables d'environnement

Créez un fichier `.env.production` :

```env
DATABASE_URL=postgresql://neondb_owner:xxx@ep-xxx.neon.tech/neondb?sslmode=require
SESSION_SECRET=votre-secret-aleatoire-32-chars-minimum
NODE_ENV=production
APP_URL=https://votre-domaine.scw.cloud

S3_ENDPOINT=https://s3.fr-par.scw.cloud
S3_REGION=fr-par
S3_ACCESS_KEY_ID=SCWXXXXXXXXXX
S3_SECRET_ACCESS_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
S3_BUCKET_NAME=supchaissac
```

### 2. Build Docker

```bash
# Build pour linux/amd64 (requis pour Scaleway)
docker build --platform linux/amd64 -t supchaissac-app .
```

### 3. Push vers le registry

```bash
# Tag l'image
docker tag supchaissac-app:latest rg.fr-par.scw.cloud/supchaissac/supchaissac-v2:latest

# Push
docker push rg.fr-par.scw.cloud/supchaissac/supchaissac-v2:latest
```

### 4. Créer le container Serverless

```bash
# Première fois : créer le container
scw container container create \
  name=supchaissac-app \
  namespace-id=<NAMESPACE_ID> \
  registry-image=rg.fr-par.scw.cloud/supchaissac/supchaissac-v2:latest \
  min-scale=0 \
  max-scale=5 \
  memory-limit=1024 \
  cpu-limit=560 \
  port=8080 \
  http-option=redirected \
  privacy=public

# Configurer les variables d'environnement via la console Scaleway
```

### 5. Déployer une mise à jour

```bash
# Build + Push + Deploy (script complet)
docker build --platform linux/amd64 -t supchaissac-app . && \
docker tag supchaissac-app:latest rg.fr-par.scw.cloud/supchaissac/supchaissac-v2:latest && \
docker push rg.fr-par.scw.cloud/supchaissac/supchaissac-v2:latest && \
scw container container deploy <CONTAINER_ID>
```

---

## Configuration du Container

### Variables d'environnement (Console Scaleway)

| Variable | Valeur |
|----------|--------|
| NODE_ENV | production |
| DATABASE_URL | postgresql://... |
| SESSION_SECRET | (générer une chaîne aléatoire) |
| APP_URL | https://xxx.functions.fnc.fr-par.scw.cloud |
| S3_ENDPOINT | https://s3.fr-par.scw.cloud |
| S3_REGION | fr-par |
| S3_ACCESS_KEY_ID | SCWXXX |
| S3_SECRET_ACCESS_KEY | xxx |
| S3_BUCKET_NAME | supchaissac |

### Paramètres du container

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| Min scale | 0 | Éteint quand pas utilisé (gratuit) |
| Max scale | 5 | Maximum 5 instances |
| Memory | 1024 MB | Mémoire par instance |
| CPU | 560m | 0.56 vCPU par instance |
| Timeout | 300s | Timeout des requêtes |
| Port | 8080 | Port exposé |

---

## Domaine personnalisé (optionnel)

### 1. Ajouter un domaine

Via la console Scaleway > Serverless Containers > Votre container > Endpoints :

1. Add custom domain
2. Entrez votre domaine (ex: supchaissac.college-chaissac.fr)
3. Configurez le CNAME DNS vers l'URL Scaleway

### 2. Configuration DNS

```
supchaissac.college-chaissac.fr  CNAME  xxx.functions.fnc.fr-par.scw.cloud
```

---

## Monitoring

### Logs

```bash
# Via CLI (limité)
scw container container get <CONTAINER_ID>

# Via Console : Serverless Containers > Logs
```

### Métriques

Console Scaleway > Serverless Containers > Metrics :
- Requêtes/seconde
- Temps de réponse
- Erreurs
- Instances actives

---

## Coûts estimés

### Free Tier Scaleway (mensuel)

| Ressource | Gratuit | Votre usage |
|-----------|---------|-------------|
| vCPU | 200 000 vCPU-s | ~1 000 (usage léger) |
| Mémoire | 400 000 GB-s | ~2 000 (usage léger) |
| Object Storage | 75 GB | ~1 GB (fichiers) |

### Coûts au-delà du free tier

| Ressource | Prix |
|-----------|------|
| vCPU | €1.00 / 100 000 vCPU-s |
| Mémoire | €1.20 / 100 000 GB-s |
| Object Storage | €0.01 / GB / mois |
| Registry | €0.01 / GB / mois |

**Estimation mensuelle** : €0.01 - €0.50 (usage collège)

---

## Troubleshooting

### Container ne démarre pas

1. Vérifiez les logs dans la console
2. Vérifiez les variables d'environnement
3. Testez l'image localement :
```bash
docker run -p 8080:8080 --env-file .env.production supchaissac-app
```

### Erreur de connexion BDD

1. Vérifiez DATABASE_URL
2. Vérifiez que l'IP Scaleway est autorisée sur Neon
3. Testez la connexion :
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Fichiers non uploadés

1. Vérifiez les credentials S3
2. Vérifiez les permissions du bucket
3. Vérifiez la politique CORS du bucket

### Cold start lent

Le premier accès après inactivité peut prendre 5-10 secondes (cold start).
Pour réduire : augmentez min-scale à 1 (mais coût supplémentaire).

---

## Sauvegarde

### Base de données

Neon effectue des sauvegardes automatiques. Pour une sauvegarde manuelle :

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Fichiers S3

```bash
# Avec AWS CLI configuré pour Scaleway
aws s3 sync s3://supchaissac ./backup-fichiers --endpoint-url https://s3.fr-par.scw.cloud
```

---

## Mise à jour de l'application

Script de déploiement complet (`deploy.sh`) :

```bash
#!/bin/bash
set -e

echo "🏗️ Build Docker..."
docker build --platform linux/amd64 -t supchaissac-app .

echo "🏷️ Tag image..."
docker tag supchaissac-app:latest rg.fr-par.scw.cloud/supchaissac/supchaissac-v2:latest

echo "📤 Push vers registry..."
docker push rg.fr-par.scw.cloud/supchaissac/supchaissac-v2:latest

echo "🚀 Déploiement..."
scw container container deploy 581e9931-716f-42db-b6db-586ecb5b72c7

echo "✅ Déploiement terminé !"
```

Usage :
```bash
chmod +x deploy.sh
./deploy.sh
```
