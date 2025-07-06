# Guide de configuration PostgreSQL pour SupChaissac

## Option A : Docker (Recommandé pour le développement)

### 1. Démarrer Docker Desktop
- Ouvrez Docker Desktop depuis le menu Démarrer
- Attendez que Docker soit complètement démarré (icône verte)

### 2. Démarrer PostgreSQL avec Docker Compose
```bash
# Dans le dossier SupChaissac
docker-compose up -d postgres

# Vérifier que le conteneur fonctionne
docker-compose ps
```

### 3. Configuration .env
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/supchaissac"
```

### 4. Test de connexion
```bash
node scripts/test-db-connection.js
```

---

## Option B : Base de données cloud (Plus rapide)

### Neon (Gratuit)
1. Allez sur https://neon.tech
2. Créez un compte gratuit
3. Créez une nouvelle base de données
4. Copiez l'URL de connexion
5. Mettez à jour .env :
```env
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/supchaissac?sslmode=require"
```

### Supabase (Gratuit)
1. Allez sur https://supabase.com
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Dans Settings > Database, copiez l'URL de connexion
5. Mettez à jour .env :
```env
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

### Railway (Gratuit avec limites)
1. Allez sur https://railway.app
2. Créez un compte gratuit
3. Créez un nouveau projet PostgreSQL
4. Copiez l'URL de connexion
5. Mettez à jour .env

---

## Option C : Installation locale PostgreSQL

### Windows
1. Téléchargez PostgreSQL depuis https://www.postgresql.org/download/windows/
2. Installez avec les paramètres par défaut
3. Notez le mot de passe du superutilisateur
4. Créez la base de données :
```sql
CREATE DATABASE supchaissac;
```
5. Configuration .env :
```env
DATABASE_URL="postgresql://postgres:votre_mot_de_passe@localhost:5432/supchaissac"
```

---

## Test de l'implémentation

Une fois PostgreSQL configuré :

1. **Arrêter le serveur actuel**
2. **Redémarrer avec PostgreSQL** :
```bash
npm run dev
```
3. **Vérifier les logs** :
   - Doit afficher "🐘 PostgreSQL connecté avec succès"
   - Doit initialiser les données de test

4. **Tester l'application** :
   - Ouvrir http://localhost:5000
   - Se connecter avec teacher1@example.com / password123
   - Créer une session de remplacement
   - Vérifier que les données persistent après redémarrage

---

## Dépannage

### Erreur de connexion
- Vérifiez que PostgreSQL est démarré
- Vérifiez l'URL de connexion dans .env
- Testez avec : `node scripts/test-db-connection.js`

### Erreur d'authentification
- Vérifiez le nom d'utilisateur et mot de passe
- Pour Docker : postgres/password par défaut

### Base de données inexistante
- Créez la base avec : `createdb supchaissac`
- Ou utilisez pgAdmin pour créer la base

### Port déjà utilisé
- Changez le port dans docker-compose.yml
- Ou arrêtez l'autre instance PostgreSQL
