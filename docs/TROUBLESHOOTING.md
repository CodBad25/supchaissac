# 🔧 Troubleshooting - SupChaissac

## 🚨 Problèmes Courants et Solutions

### **🔌 Problèmes de Démarrage**

#### **Erreur : "Cannot find module"**
```bash
# Symptôme
Error: Cannot find module 'express'
Module not found: Can't resolve 'react'

# Solution
rm -rf node_modules package-lock.json
npm install
```

#### **Erreur : "Port already in use"**
```bash
# Symptôme
Error: listen EADDRINUSE: address already in use :::5000

# Solutions
# 1. Changer le port
echo "PORT=3000" >> .env

# 2. Tuer le processus (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# 3. Tuer le processus (Linux/Mac)
lsof -ti:5000 | xargs kill -9
```

#### **Erreur : "Permission denied"**
```bash
# Symptôme (Linux/Mac)
EACCES: permission denied, mkdir '/var/www/supchaissac'

# Solution
sudo chown -R $USER:$USER /var/www/supchaissac
chmod -R 755 /var/www/supchaissac
```

### **🗄️ Problèmes de Base de Données**

#### **SQLite : "Database locked"**
```bash
# Symptôme
Error: SQLITE_BUSY: database is locked

# Solutions
# 1. Fermer toutes les connexions
pkill -f supchaissac

# 2. Supprimer les fichiers de verrouillage
rm data/supchaissac.db-wal
rm data/supchaissac.db-shm

# 3. Redémarrer l'application
npm run dev
```

#### **PostgreSQL : "Connection refused"**
```bash
# Symptôme
Error: connect ECONNREFUSED 127.0.0.1:5432

# Solutions
# 1. Vérifier que PostgreSQL est démarré
# Docker
docker-compose ps
docker-compose up -d postgres

# Service local (Linux)
sudo systemctl status postgresql
sudo systemctl start postgresql

# Service local (Windows)
net start postgresql-x64-13

# 2. Vérifier l'URL de connexion
node scripts/test-db-connection.js
```

#### **PostgreSQL : "Authentication failed"**
```bash
# Symptôme
Error: password authentication failed for user "postgres"

# Solutions
# 1. Vérifier les identifiants dans .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/supchaissac"

# 2. Réinitialiser le mot de passe (Docker)
docker exec -it supchaissac-postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'password';"

# 3. Vérifier pg_hba.conf
docker exec supchaissac-postgres cat /var/lib/postgresql/data/pg_hba.conf
```

#### **PostgreSQL : "Database does not exist"**
```bash
# Symptôme
Error: database "supchaissac" does not exist

# Solutions
# 1. Créer la base de données
createdb supchaissac

# 2. Avec Docker
docker exec -it supchaissac-postgres createdb -U postgres supchaissac

# 3. Avec psql
psql -U postgres -c "CREATE DATABASE supchaissac;"
```

### **🔐 Problèmes d'Authentification**

#### **Sessions perdues après redémarrage**
```bash
# Symptôme
Utilisateur déconnecté après redémarrage du serveur

# Cause
Session store en mémoire (MemoryStore)

# Solution
# Utiliser PostgreSQL ou Redis pour les sessions
# Déjà implémenté avec PgStorage
```

#### **Erreur : "Invalid credentials"**
```bash
# Symptôme
Impossible de se connecter avec les comptes de test

# Solutions
# 1. Vérifier que les données de test sont créées
# Regarder les logs au démarrage

# 2. Réinitialiser la base de données
rm -rf data/
npm run dev

# 3. Vérifier les comptes dans la base
# SQLite
sqlite3 data/supchaissac.db "SELECT username, name, role FROM users;"

# PostgreSQL
psql -U postgres -d supchaissac -c "SELECT username, name, role FROM users;"
```

### **🌐 Problèmes de Déploiement**

#### **Build échoue en production**
```bash
# Symptôme
npm run build fails with TypeScript errors

# Solutions
# 1. Vérifier la version Node.js
node --version  # Doit être 18+

# 2. Nettoyer et réinstaller
rm -rf node_modules package-lock.json dist
npm install
npm run build

# 3. Vérifier les types
npm run type-check
```

#### **Variables d'environnement non chargées**
```bash
# Symptôme
process.env.DATABASE_URL is undefined

# Solutions
# 1. Vérifier le fichier .env
cat .env

# 2. Vérifier le chargement dotenv
# Ajouter en début de server/index.ts
import dotenv from 'dotenv';
dotenv.config();

# 3. Variables d'environnement système (production)
export DATABASE_URL="postgresql://..."
export SESSION_SECRET="..."
```

#### **Erreur 502 Bad Gateway (Nginx)**
```bash
# Symptôme
Nginx retourne 502 Bad Gateway

# Solutions
# 1. Vérifier que l'application fonctionne
curl http://localhost:5000

# 2. Vérifier la configuration Nginx
nginx -t
sudo systemctl reload nginx

# 3. Vérifier les logs
sudo tail -f /var/log/nginx/error.log
```

### **📱 Problèmes Multi-Plateforme**

#### **Différences Windows/Linux**
```bash
# Problème : Chemins de fichiers
# Windows : data\supchaissac.db
# Linux : data/supchaissac.db

# Solution : Utiliser path.join()
import path from 'path';
const dbPath = path.join('data', 'supchaissac.db');
```

#### **Problèmes d'encodage**
```bash
# Symptôme
Caractères spéciaux mal affichés

# Solutions
# 1. Vérifier l'encodage de la base
# PostgreSQL
SHOW client_encoding;

# 2. Forcer UTF-8
DATABASE_URL="postgresql://...?client_encoding=utf8"

# 3. Headers HTTP
Content-Type: application/json; charset=utf-8
```

### **⚡ Problèmes de Performance**

#### **Application lente**
```bash
# Diagnostic
# 1. Vérifier les logs
npm run dev  # Regarder les temps de réponse

# 2. Profiler la base de données
# PostgreSQL
EXPLAIN ANALYZE SELECT * FROM sessions;

# 3. Vérifier la mémoire
# Linux
free -h
top -p $(pgrep node)

# Windows
tasklist /fi "imagename eq node.exe"
```

#### **Base de données lente**
```sql
-- Diagnostic PostgreSQL
-- 1. Requêtes lentes
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 2. Index manquants
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'sessions';

-- Solutions
-- Créer des index
CREATE INDEX idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_status ON sessions(status);
```

## 🛠️ Outils de Diagnostic

### **Scripts de Diagnostic**

#### **health-check.js**
```javascript
// scripts/health-check.js
import { createStorage } from '../server/storage-factory.js';

async function healthCheck() {
  console.log('🔍 Diagnostic SupChaissac...\n');
  
  // Test base de données
  try {
    const storage = await createStorage();
    const users = await storage.getSystemSettings();
    console.log('✅ Base de données : OK');
  } catch (error) {
    console.log('❌ Base de données : ERREUR');
    console.log('   ', error.message);
  }
  
  // Test serveur
  try {
    const response = await fetch('http://localhost:5000/api/health');
    if (response.ok) {
      console.log('✅ Serveur : OK');
    } else {
      console.log('❌ Serveur : ERREUR HTTP', response.status);
    }
  } catch (error) {
    console.log('❌ Serveur : INACCESSIBLE');
  }
  
  // Informations système
  console.log('\n📊 Informations système :');
  console.log('   Node.js :', process.version);
  console.log('   Plateforme :', process.platform);
  console.log('   Architecture :', process.arch);
  console.log('   Mémoire :', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
}

healthCheck().catch(console.error);
```

#### **Utilisation**
```bash
node scripts/health-check.js
```

### **Logs Utiles**

#### **Activation des logs détaillés**
```env
# .env
LOG_LEVEL=debug
DEBUG=supchaissac:*
```

#### **Logs par composant**
```javascript
// server/index.ts
import debug from 'debug';
const log = debug('supchaissac:server');

log('Serveur démarré sur le port %d', port);
```

### **Monitoring en Production**

#### **PM2 Monitoring**
```bash
# Statut des processus
pm2 status

# Logs en temps réel
pm2 logs supchaissac --lines 100

# Monitoring ressources
pm2 monit

# Redémarrage automatique
pm2 restart supchaissac
```

#### **Logs Nginx**
```bash
# Logs d'accès
sudo tail -f /var/log/nginx/access.log

# Logs d'erreur
sudo tail -f /var/log/nginx/error.log

# Logs spécifiques au site
sudo tail -f /var/log/nginx/supchaissac.access.log
```

## 📞 Obtenir de l'Aide

### **Informations à Fournir**

#### **Rapport de Bug**
```
🐛 Description du problème :
[Décrire le problème]

🔄 Étapes pour reproduire :
1. [Étape 1]
2. [Étape 2]
3. [Résultat obtenu]

✅ Résultat attendu :
[Ce qui devrait se passer]

💻 Environnement :
- OS : [Windows 11 / macOS 13 / Ubuntu 22.04]
- Node.js : [version]
- npm : [version]
- Base de données : [SQLite / PostgreSQL]

📋 Logs :
[Coller les logs d'erreur]

🔧 Configuration :
[Contenu du .env (sans les mots de passe)]
```

### **Commandes de Diagnostic**
```bash
# Informations système
node --version
npm --version
git --version

# État de l'application
npm run health-check
node scripts/test-db-connection.js

# Logs récents
pm2 logs supchaissac --lines 50
```

### **Ressources**
- **Documentation** : docs/
- **Issues GitHub** : [URL du repository]
- **Logs** : Toujours inclure dans les rapports
- **Configuration** : Vérifier .env et variables d'environnement
