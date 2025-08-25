# 🚀 Guide de Déploiement SupChaissac

## Déploiement Automatique sur Vercel

### 1. Connecter le Repository
1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous avec GitHub
3. Cliquez "New Project"
4. Sélectionnez `supchaissac`
5. Cliquez "Import"

### 2. Variables d'Environnement
Dans les paramètres Vercel, ajoutez :

```
AUTH_MODE=PRODUCTION
SESSION_SECRET=supchaissac-secret-2025-ultra-secure
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
```

### 3. Configuration Build
- **Framework:** Other
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 4. Test des Endpoints
Une fois déployé :
- `/api/health` - Status de l'API
- `/api/user` - Endpoint utilisateur
- `/api/login` - Endpoint de connexion

## 🔧 Déploiement Local
```bash
npm install
npm run build
npm run dev
```

## 📊 Monitoring
- Logs Vercel : Dashboard Vercel > Functions
- Erreurs : Console navigateur
- Base de données : Logs PostgreSQL
