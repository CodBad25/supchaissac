# 🚀 Guide de Déploiement - SupChaissac

## 🎯 Options de Déploiement

### **🏆 Recommandations par Cas d'Usage**

| Cas d'usage | Plateforme | Base de données | Coût | Complexité |
|-------------|------------|-----------------|------|------------|
| **Développement collaboratif** | Vercel + Neon | PostgreSQL | Gratuit | ⭐ |
| **Démonstration** | Railway | PostgreSQL intégré | Gratuit | ⭐ |
| **Production légère** | Vercel + Supabase | PostgreSQL | Gratuit → 20€/mois | ⭐⭐ |
| **Production robuste** | VPS + Docker | PostgreSQL | 10-50€/mois | ⭐⭐⭐ |
| **Éducation Nationale** | Serveur académique | PostgreSQL | Variable | ⭐⭐⭐⭐ |

## 🌐 Déploiement Cloud (Recommandé)

### **Option A : Vercel + Neon (Gratuit)**

#### **Avantages**
- ✅ **Gratuit** pour le développement
- ✅ **Déploiement automatique** depuis Git
- ✅ **Performance** excellente
- ✅ **SSL** automatique
- ✅ **Multi-plateforme** (PC, Mac, mobile)

#### **1. Préparation du projet**
```bash
# Créer un repository Git
git init
git add .
git commit -m "Initial commit"

# Pousser sur GitHub/GitLab
git remote add origin <your-repo-url>
git push -u origin main
```

#### **2. Configuration Neon (Base de données)**
1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer une nouvelle base de données
3. Copier l'URL de connexion
4. Noter l'URL pour Vercel

#### **3. Déploiement Vercel**
1. Créer un compte sur [vercel.com](https://vercel.com)
2. Connecter votre repository GitHub
3. Configurer les variables d'environnement :
```env
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/supchaissac?sslmode=require
SESSION_SECRET=your-super-secret-key-for-production
NODE_ENV=production
```
4. Déployer automatiquement

#### **4. Configuration Build Vercel**
Créer `vercel.json` :
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ]
}
```

### **Option B : Railway (Tout-en-un)**

#### **Avantages**
- ✅ **Simple** : Base de données incluse
- ✅ **Gratuit** : 5$/mois de crédit
- ✅ **Déploiement** en un clic
- ✅ **Logs** intégrés

#### **1. Déploiement Railway**
1. Créer un compte sur [railway.app](https://railway.app)
2. "Deploy from GitHub"
3. Sélectionner votre repository
4. Railway détecte automatiquement Node.js

#### **2. Ajouter PostgreSQL**
1. Dans le projet Railway : "Add Service"
2. Sélectionner "PostgreSQL"
3. Railway génère automatiquement DATABASE_URL

#### **3. Variables d'environnement**
```env
SESSION_SECRET=your-super-secret-key-for-production
NODE_ENV=production
# DATABASE_URL est automatiquement fournie par Railway
```

### **Option C : Supabase + Vercel**

#### **Avantages**
- ✅ **Interface** d'administration incluse
- ✅ **Authentification** avancée (future)
- ✅ **API** temps réel (future)
- ✅ **Stockage** de fichiers (future)

#### **Configuration Supabase**
1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Dans Settings > Database, copier l'URL
4. Utiliser avec Vercel comme Option A

## 🏢 Déploiement Éducation Nationale

### **Serveurs Académiques**

#### **Prérequis**
- **Serveur Linux** (Ubuntu/CentOS)
- **Node.js 18+** installé
- **PostgreSQL** installé
- **Nginx** pour le reverse proxy
- **SSL** certificat (Let's Encrypt)

#### **1. Préparation du serveur**
```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installation Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation PostgreSQL
sudo apt install postgresql postgresql-contrib

# Installation Nginx
sudo apt install nginx

# Installation PM2 (gestionnaire de processus)
sudo npm install -g pm2
```

#### **2. Configuration PostgreSQL**
```bash
# Créer utilisateur et base de données
sudo -u postgres psql
CREATE USER supchaissac WITH PASSWORD 'secure_password';
CREATE DATABASE supchaissac OWNER supchaissac;
GRANT ALL PRIVILEGES ON DATABASE supchaissac TO supchaissac;
\q
```

#### **3. Déploiement application**
```bash
# Cloner le projet
git clone <your-repo-url> /var/www/supchaissac
cd /var/www/supchaissac

# Installation dépendances
npm install

# Configuration
cp .env.example .env
# Éditer .env avec les bonnes valeurs

# Build production
npm run build

# Démarrage avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### **4. Configuration Nginx**
```nginx
# /etc/nginx/sites-available/supchaissac
server {
    listen 80;
    server_name your-domain.ac-academie.fr;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **5. SSL avec Let's Encrypt**
```bash
# Installation Certbot
sudo apt install certbot python3-certbot-nginx

# Obtention certificat
sudo certbot --nginx -d your-domain.ac-academie.fr

# Renouvellement automatique
sudo crontab -e
# Ajouter : 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🐳 Déploiement Docker

### **Production avec Docker**

#### **1. Dockerfile optimisé**
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/package.json ./

EXPOSE 5000
CMD ["npm", "start"]
```

#### **2. Docker Compose Production**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/supchaissac
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: supchaissac
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

#### **3. Déploiement**
```bash
# Variables d'environnement
echo "POSTGRES_PASSWORD=secure_password" > .env.prod
echo "SESSION_SECRET=super-secret-key" >> .env.prod

# Démarrage
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## 🔧 Configuration Multi-Plateforme

### **Variables d'Environnement par Environnement**

#### **Développement (.env.development)**
```env
DATABASE_URL=sqlite://./data/supchaissac.db
SESSION_SECRET=dev-secret-key
NODE_ENV=development
PORT=5000
LOG_LEVEL=debug
```

#### **Test (.env.test)**
```env
DATABASE_URL=sqlite://./data/test.db
SESSION_SECRET=test-secret-key
NODE_ENV=test
PORT=5001
LOG_LEVEL=error
```

#### **Production (.env.production)**
```env
DATABASE_URL=postgresql://user:pass@host:5432/supchaissac
SESSION_SECRET=super-secure-production-key
NODE_ENV=production
PORT=5000
LOG_LEVEL=info
```

### **Scripts de Déploiement**

#### **deploy.sh (Linux/Mac)**
```bash
#!/bin/bash
set -e

echo "🚀 Déploiement SupChaissac..."

# Sauvegarde
npm run backup

# Mise à jour code
git pull origin main

# Installation dépendances
npm ci --only=production

# Build
npm run build

# Redémarrage
pm2 restart supchaissac

echo "✅ Déploiement terminé !"
```

#### **deploy.bat (Windows)**
```batch
@echo off
echo 🚀 Déploiement SupChaissac...

REM Sauvegarde
call npm run backup

REM Mise à jour code
git pull origin main

REM Installation dépendances
call npm ci --only=production

REM Build
call npm run build

REM Redémarrage (adapter selon votre gestionnaire)
echo ✅ Déploiement terminé !
pause
```

## 📊 Monitoring et Maintenance

### **Logs et Monitoring**
```bash
# Logs PM2
pm2 logs supchaissac

# Monitoring ressources
pm2 monit

# Statut des services
pm2 status
```

### **Sauvegarde Automatique**
```bash
# Script de sauvegarde quotidienne
#!/bin/bash
# /etc/cron.daily/supchaissac-backup

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/supchaissac"

# Sauvegarde base de données
pg_dump -h localhost -U supchaissac supchaissac > "$BACKUP_DIR/db_$DATE.sql"

# Sauvegarde fichiers
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" /var/www/supchaissac

# Nettoyage (garder 30 jours)
find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
```

## 🔐 Sécurité Production

### **Checklist Sécurité**
- ✅ **HTTPS** activé avec certificat valide
- ✅ **Mots de passe** forts et uniques
- ✅ **Firewall** configuré (ports 80, 443, 22 seulement)
- ✅ **Mises à jour** système automatiques
- ✅ **Sauvegarde** quotidienne
- ✅ **Monitoring** des erreurs
- ✅ **Logs** sécurisés et rotatifs

### **Variables Sensibles**
```bash
# Génération de clés sécurisées
openssl rand -base64 32  # SESSION_SECRET
openssl rand -base64 16  # DATABASE_PASSWORD
```

## 📞 Support Déploiement

### **Problèmes Courants**
1. **Build échoue** → Vérifier versions Node.js
2. **Base de données inaccessible** → Vérifier URL et permissions
3. **Port occupé** → Changer PORT dans .env
4. **SSL invalide** → Renouveler certificat

### **Contacts**
- **Documentation** : Voir docs/TROUBLESHOOTING.md
- **Logs** : Toujours inclure dans les rapports de bug
- **Versions** : Node.js, npm, OS dans les rapports
