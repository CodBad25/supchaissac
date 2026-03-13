# Guide de Déploiement - SupChaissac v2.0

## Architecture de production

```
┌─────────────────────────────────────────────────────────┐
│              ORACLE CLOUD VPS (89.168.61.230)            │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Docker + Nginx                      │    │
│  │  ┌─────────────────────────────────────────┐   │    │
│  │  │           Docker Container              │   │    │
│  │  │  ┌─────────┐    ┌──────────────────┐   │   │    │
│  │  │  │ Express │    │   React (Vite)   │   │   │    │
│  │  │  │ Backend │    │    Frontend      │   │   │    │
│  │  │  └────┬────┘    └──────────────────┘   │   │    │
│  │  │       │     ┌──────────────────────┐   │   │    │
│  │  │       └────▶│ Stockage local       │   │   │    │
│  │  │             │ /app/uploads         │   │   │    │
│  │  │             └──────────────────────┘   │   │    │
│  │  └───────┬────────────────────────────────┘   │    │
│  └──────────┼────────────────────────────────────┘    │
└─────────────┼─────────────────────────────────────────┘
              │
    ┌─────────▼──────────┐    ┌─────────────────────────┐
    │  Docker Volume     │    │   NEON (PostgreSQL)     │
    │  Stockage fichiers │    │   Base de données       │
    └────────────────────┘    └─────────────────────────┘
```

---

## Infrastructure

| Composant | Service | Détails |
|-----------|---------|---------|
| **Serveur** | Oracle Cloud VPS | `89.168.61.230`, Ubuntu 24.04 ARM |
| **Reverse proxy** | Nginx | SSL + reverse proxy vers Docker |
| **Application** | Docker | node:20-alpine, port 8080 |
| **Base de données** | Neon PostgreSQL | eu-central-1 (Frankfurt) |
| **Stockage fichiers** | Local (Docker volume) | `/app/uploads` monté sur le VPS |
| **DNS** | OVH | CNAME beltools.fr |

---

## URL publique

- **URL** : https://supchaissac.beltools.fr
- **DNS** : CNAME `supchaissac.beltools.fr` → serveur Oracle Cloud (OVH)
- **SSL** : via Nginx (Let's Encrypt)

---

## Déploiement

### Build et lancement du container

```bash
# Sur le serveur Oracle Cloud
docker build -t supchaissac-app .
docker stop supchaissac-app && docker rm supchaissac-app
docker run -d --name supchaissac-app --env-file .env -p 8080:8080 \
  -v /data/supchaissac/uploads:/app/uploads \
  --restart unless-stopped supchaissac-app
```

**Note** : Le dossier `/data/supchaissac/uploads` doit exister sur l'hôte avec les bonnes permissions.

### Variables d'environnement (.env)

| Variable | Description |
|----------|-------------|
| DATABASE_URL | Connexion Neon PostgreSQL |
| SESSION_SECRET | Secret pour cookies d'authentification |
| NODE_ENV | `production` |
| APP_URL | `https://supchaissac.beltools.fr` |
| UPLOAD_DIR | Chemin du dossier de stockage (ex: `./uploads`) |

---

## Sauvegarde

### Base de données

Neon effectue des sauvegardes automatiques. Pour une sauvegarde manuelle :

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Fichiers locaux

Effectuer une sauvegarde du dossier uploads sur le serveur Oracle Cloud :

```bash
# Sauvegarde locale
tar -czf backup-uploads-$(date +%Y%m%d).tar.gz /data/supchaissac/uploads/

# Ou copier sur une machine distante via rsync
rsync -avz -e ssh /data/supchaissac/uploads/ utilisateur@machine-sauvegarde:/backups/supchaissac/
```

---

## Troubleshooting

### Container ne démarre pas

1. Vérifier les logs : `docker logs supchaissac-app`
2. Vérifier les variables d'environnement dans `.env`
3. Tester la connexion BDD : `psql $DATABASE_URL -c "SELECT 1"`

### Erreur de connexion BDD

1. Vérifier `DATABASE_URL`
2. Neon cold start peut prendre 10-20s (timeout configuré à 30s)

### Fichiers non uploadés

1. Vérifier que le dossier `/data/supchaissac/uploads` existe et est accessible :
   ```bash
   ls -la /data/supchaissac/uploads
   ```
2. Vérifier les permissions (le container Docker doit pouvoir écrire) :
   ```bash
   chmod 755 /data/supchaissac/uploads
   ```
3. Vérifier le montage du volume Docker :
   ```bash
   docker inspect supchaissac-app | grep -A 5 Mounts
   ```
4. Consulter les logs du container :
   ```bash
   docker logs supchaissac-app | grep -i upload
   ```
