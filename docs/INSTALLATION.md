# 🚀 Guide d'Installation - SupChaissac

## 📋 Prérequis

### **Obligatoires**
- **Node.js** 18.0+ ([Télécharger](https://nodejs.org/))
- **npm** 8.0+ (inclus avec Node.js)
- **Git** ([Télécharger](https://git-scm.com/))

### **Optionnels**
- **Docker Desktop** ([Télécharger](https://www.docker.com/products/docker-desktop/)) - Pour PostgreSQL
- **PostgreSQL** local - Alternative à Docker

## 🔧 Installation Rapide

### **1. Cloner le projet**
```bash
git clone <url-du-repo>
cd SupChaissac
```

### **2. Installer les dépendances**
```bash
npm install
```

### **3. Configuration**
```bash
# Copier le fichier de configuration
cp .env.example .env

# Éditer .env selon vos besoins (optionnel pour SQLite)
```

### **4. Démarrer l'application**
```bash
npm run dev
```

🎉 **L'application est accessible sur http://localhost:5000**

## 🗄️ Configuration Base de Données

### **Option A : SQLite (Recommandé pour le développement)**

**Aucune configuration requise !** SQLite est utilisé par défaut.

```bash
# L'application crée automatiquement :
# - ./data/supchaissac.db
# - Données de test pré-chargées
```

### **Option B : PostgreSQL avec Docker**

#### **1. Démarrer PostgreSQL**
```bash
# Démarrer Docker Desktop puis :
docker-compose up -d postgres

# Vérifier le statut
docker-compose ps
```

#### **2. Configuration .env**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/supchaissac"
```

#### **3. Redémarrer l'application**
```bash
npm run dev
```

### **Option C : PostgreSQL Cloud**

#### **Neon (Gratuit)**
1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer une nouvelle base de données
3. Copier l'URL de connexion
4. Mettre à jour `.env` :
```env
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/supchaissac?sslmode=require"
```

#### **Supabase (Gratuit)**
1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Dans Settings > Database, copier l'URL
4. Mettre à jour `.env` :
```env
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

## 🔐 Comptes de Test

L'application crée automatiquement des comptes de test :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| teacher1@example.com | password123 | Enseignant |
| teacher2@example.com | password123 | Enseignant (PACTE) |
| secretary@example.com | password123 | Secrétaire |
| principal@example.com | password123 | Principal |
| admin@example.com | password123 | Administrateur |

## 📱 Environnements Multi-Plateforme

### **Windows**
```bash
# PowerShell ou CMD
npm install
npm run dev
```

### **macOS**
```bash
# Terminal
npm install
npm run dev
```

### **Linux**
```bash
# Terminal
npm install
npm run dev
```

### **Docker (Toutes plateformes)**
```bash
# Construction de l'image
docker build -t supchaissac .

# Démarrage avec docker-compose
docker-compose up -d
```

## 🛠️ Scripts Disponibles

```bash
# Développement
npm run dev          # Démarrer en mode développement
npm run build        # Construire pour la production
npm run preview      # Prévisualiser la build de production

# Base de données
npm run db:push      # Synchroniser le schéma avec la DB
npm run db:studio    # Interface graphique Drizzle Studio

# Utilitaires
npm run lint         # Vérifier le code
npm run type-check   # Vérifier les types TypeScript
```

## 🔧 Configuration Avancée

### **Variables d'Environnement**

Créer un fichier `.env` avec :

```env
# Base de données
DATABASE_URL="sqlite://./data/supchaissac.db"  # SQLite par défaut
# DATABASE_URL="postgresql://user:pass@host:5432/db"  # PostgreSQL

# Session
SESSION_SECRET="your-super-secret-key-change-in-production"

# Serveur
PORT=5000
NODE_ENV="development"

# Logging
LOG_LEVEL="info"
```

### **Configuration Docker**

Le fichier `docker-compose.yml` inclut :
- **PostgreSQL** avec données persistantes
- **pgAdmin** (optionnel) pour l'administration
- **Configuration réseau** automatique

```bash
# Démarrer tous les services
docker-compose up -d

# Démarrer seulement PostgreSQL
docker-compose up -d postgres

# Démarrer avec pgAdmin
docker-compose --profile admin up -d
```

## 🚨 Dépannage

### **Erreur : "Cannot find module"**
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### **Erreur : "Port 5000 already in use"**
```bash
# Changer le port dans .env
PORT=3000
```

### **Erreur de base de données**
```bash
# Tester la connexion
node scripts/test-db-connection.js

# Réinitialiser SQLite
rm -rf data/
npm run dev
```

### **Erreur Docker**
```bash
# Vérifier Docker Desktop
docker --version
docker ps

# Redémarrer les conteneurs
docker-compose down
docker-compose up -d
```

## 📊 Vérification de l'Installation

### **1. Tester l'application**
- Ouvrir http://localhost:5000
- Se connecter avec teacher1@example.com / password123
- Créer une session de remplacement
- Vérifier que les données persistent après redémarrage

### **2. Tester l'API**
```bash
# Test de connexion
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"teacher1@example.com","password":"password123"}' \
  http://localhost:5000/api/login

# Test des sessions
curl http://localhost:5000/api/sessions
```

### **3. Vérifier la base de données**
```bash
# SQLite
ls -la data/

# PostgreSQL avec Docker
docker exec supchaissac-postgres psql -U postgres -d supchaissac -c "\dt"
```

## 🔄 Migration depuis une Version Antérieure

### **Depuis MemStorage**
1. Sauvegarder les données existantes
2. Installer la nouvelle version
3. Les données de test seront recréées automatiquement

### **Depuis une Sauvegarde**
1. Copier le dossier de sauvegarde
2. Installer les dépendances : `npm install`
3. Démarrer : `npm run dev`

## 🌐 Déploiement en Production

### **Préparation**
```bash
# Build de production
npm run build

# Variables d'environnement de production
NODE_ENV=production
DATABASE_URL="postgresql://..."
SESSION_SECRET="strong-secret-key"
```

### **Plateformes recommandées**
- **Vercel** - Frontend + API
- **Railway** - Full-stack avec PostgreSQL
- **Heroku** - Déploiement traditionnel
- **VPS** - Contrôle total

## 📞 Support

### **Logs utiles**
```bash
# Logs de l'application
npm run dev

# Logs Docker
docker-compose logs postgres

# Test de connexion DB
node scripts/test-db-connection.js
```

### **Problèmes courants**
1. **Port occupé** → Changer PORT dans .env
2. **Base de données inaccessible** → Vérifier DATABASE_URL
3. **Dépendances manquantes** → `npm install`
4. **Permissions** → Vérifier les droits sur le dossier data/

### **Ressources**
- [Documentation Node.js](https://nodejs.org/docs/)
- [Documentation Docker](https://docs.docker.com/)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Documentation Drizzle ORM](https://orm.drizzle.team/)
