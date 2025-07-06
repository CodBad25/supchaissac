# 🎓 SupChaissac - Gestion des Heures Supplémentaires

> **Application web moderne pour la gestion des heures supplémentaires des enseignants**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)

## 🚀 Démarrage Rapide

```bash
# 1. Cloner le projet
git clone <repository-url>
cd SupChaissac

# 2. Installer les dépendances
npm install

# 3. Démarrer l'application
npm run dev
```

**🌐 Application accessible sur : http://localhost:5000**

## 👥 Comptes de Test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| teacher1@example.com | password123 | 🎓 Enseignant |
| secretary@example.com | password123 | 📝 Secrétaire |
| principal@example.com | password123 | 🏛️ Principal |
| admin@example.com | password123 | ⚙️ Administrateur |

## 📋 Fonctionnalités Principales

### **🎓 Pour les Enseignants**
- ✅ Déclaration des heures supplémentaires
- ✅ Suivi du statut des sessions
- ✅ Modification des sessions en attente
- ✅ Configuration des préférences

### **📝 Pour l'Administration**
- ✅ Workflow de validation complet
- ✅ Gestion des utilisateurs
- ✅ Rapports et statistiques
- ✅ Configuration système

### **🔄 Workflow Intégré**
```
DÉCLARATION → RÉVISION → VALIDATION → PAIEMENT
   (Enseignant)  (Secrétaire)  (Principal)    (Admin)
```

## 🏗️ Architecture Technique

### **Stack Technologique**
- **Frontend** : React 18 + TypeScript + TailwindCSS
- **Backend** : Node.js + Express + TypeScript
- **Base de données** : PostgreSQL / SQLite (hybride)
- **ORM** : Drizzle ORM
- **Authentification** : Passport.js

### **Structure du Projet**
```
SupChaissac/
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Code partagé
├── docs/            # Documentation complète
├── scripts/         # Scripts utilitaires
└── data/            # Base de données SQLite
```

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| [🏗️ ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture technique détaillée |
| [🚀 INSTALLATION.md](docs/INSTALLATION.md) | Guide d'installation multi-plateforme |
| [📋 FONCTIONNALITES.md](docs/FONCTIONNALITES.md) | Documentation des fonctionnalités |
| [🌐 DEPLOIEMENT.md](docs/DEPLOIEMENT.md) | Guide de déploiement (cloud, serveur) |
| [🔧 TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Résolution des problèmes courants |

## 🗄️ Base de Données

### **Système Hybride Intelligent**
- **SQLite** : Développement local (par défaut)
- **PostgreSQL** : Production et collaboration
- **Fallback automatique** : Basculement transparent

### **Configuration**
```env
# SQLite (développement)
# DATABASE_URL non définie

# PostgreSQL (production)
DATABASE_URL="postgresql://user:pass@host:5432/supchaissac"
```

## Installation

### Prérequis

- Node.js (v18 ou supérieur)
- npm ou yarn

### Installation des dépendances

```bash
npm install
# ou
yarn install
```

## Lancement de l'application

### Mode développement

```bash
npm run dev
# ou
yarn dev
```

L'application sera accessible à l'adresse [http://localhost:5000](http://localhost:5000).

### Construction pour la production

```bash
npm run build
# ou
yarn build
```

### Lancement en production

```bash
npm run start
# ou
yarn start
```

## 🌐 Développement Collaboratif

### **Multi-Plateforme**
- ✅ **Windows** : Support complet
- ✅ **macOS** : Support complet
- ✅ **Linux** : Support complet
- ✅ **Docker** : Déploiement containerisé

### **Déploiement Cloud**
- 🚀 **Vercel + Neon** : Gratuit, idéal pour la collaboration
- 🚀 **Railway** : Tout-en-un, simple à configurer
- 🚀 **Supabase** : Base de données avec interface d'admin
- 🏢 **Serveur académique** : Pour l'Éducation Nationale

### **Sauvegarde et Portabilité**
```bash
# Créer une sauvegarde complète
scripts/backup.bat  # Windows
./scripts/backup.sh # Linux/Mac

# Restaurer depuis une sauvegarde
cp -r backups/supchaissac-backup-YYYY-MM-DD/* ./
npm install
npm run dev
```

## 🛠️ Scripts Utiles

```bash
# Développement
npm run dev          # Démarrer en mode développement
npm run build        # Construire pour la production
npm run preview      # Prévisualiser la build

# Base de données
npm run db:push      # Synchroniser le schéma
npm run db:studio    # Interface graphique Drizzle

# Utilitaires
npm run lint         # Vérifier le code
npm run type-check   # Vérifier les types
```

## 🔧 Configuration Avancée

### **Variables d'Environnement**
```env
# Base de données
DATABASE_URL="sqlite://./data/supchaissac.db"  # SQLite
# DATABASE_URL="postgresql://..."              # PostgreSQL

# Session
SESSION_SECRET="your-secret-key"

# Serveur
PORT=5000
NODE_ENV="development"
```

### **Docker (Optionnel)**
```bash
# PostgreSQL avec Docker
docker-compose up -d postgres

# Application complète
docker-compose up -d
```

## 📞 Support et Contribution

### **Problèmes**
- 📖 Consulter [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- 🔍 Utiliser `node scripts/test-db-connection.js` pour diagnostiquer
- 📋 Inclure les logs dans les rapports de bug

### **Développement**
- 🏗️ Architecture : [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 🚀 Installation : [INSTALLATION.md](docs/INSTALLATION.md)
- 🌐 Déploiement : [DEPLOIEMENT.md](docs/DEPLOIEMENT.md)

## 📄 Licence

MIT - Voir le fichier LICENSE pour plus de détails.
