# 🚀 Guide de Correction Vercel - SupChaissac

## 🔧 Problèmes Corrigés

### 1. **Configuration Vercel (vercel.json)**
- ✅ Chemins corrigés vers `client/dist` au lieu de `dist/public`
- ✅ Timeout API augmenté à 30 secondes
- ✅ Routes statiques et API configurées correctement

### 2. **API Wrapper (api/index.js)**
- ✅ Import du serveur Express corrigé
- ✅ Middleware CORS, session et Passport configurés
- ✅ Gestion d'erreur améliorée
- ✅ Health check ajouté

### 3. **Code JavaScript (selectedRole)**
- ✅ Variable `selectedRole` réajoutée dans auth-page.tsx
- ✅ Fonction `handleDemoLogin` corrigée
- ✅ État local géré correctement

### 4. **Fichiers Statiques**
- ✅ vite.svg ajouté pour éviter l'erreur 404
- ✅ Build Vite généré dans le bon dossier

## 📋 Étapes de Redéploiement

### 1. **Pousser les Corrections**
```bash
git add .
git commit -m "Fix Vercel deployment: API wrapper, selectedRole, and static files"
git push origin main
```

### 2. **Variables d'Environnement Vercel**
Dans les paramètres de votre projet Vercel, ajoutez :

```env
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
SESSION_SECRET=your-super-secret-key-for-production
NODE_ENV=production
```

### 3. **Redéploiement Automatique**
- Vercel redéploiera automatiquement après le push
- Surveillez les logs de build dans le dashboard Vercel

## 🧪 Tests Post-Déploiement

### 1. **Vérifications de Base**
- [ ] Page de connexion s'affiche sans erreur JavaScript
- [ ] Boutons de démonstration fonctionnent
- [ ] API `/api/health` répond avec status 200
- [ ] Connexion avec un compte de test fonctionne

### 2. **Comptes de Test**
- **teacher1@example.com** / password123
- **secretary@example.com** / password123  
- **principal@example.com** / password123
- **admin@example.com** / password123

### 3. **URLs à Tester**
- `https://votre-app.vercel.app/` - Page de connexion
- `https://votre-app.vercel.app/api/health` - Health check
- `https://votre-app.vercel.app/api/user` - API utilisateur

## 🔍 Debugging

### Si l'erreur persiste :

1. **Vérifiez les logs Vercel**
   - Dashboard Vercel > Votre projet > Functions
   - Regardez les erreurs dans les logs

2. **Testez l'API directement**
   ```bash
   curl https://votre-app.vercel.app/api/health
   ```

3. **Vérifiez la console du navigateur**
   - F12 > Console
   - Recherchez les erreurs JavaScript

## 📞 Support

Si vous rencontrez encore des problèmes :
1. Partagez l'URL de votre déploiement Vercel
2. Copiez les logs d'erreur du dashboard Vercel
3. Indiquez les erreurs de la console du navigateur

## ✅ Résultat Attendu

Après ces corrections, vous devriez avoir :
- ✅ Page de connexion sans erreur JavaScript
- ✅ API fonctionnelle (codes 200 au lieu de 500)
- ✅ Boutons de démonstration opérationnels
- ✅ Connexion et navigation fluides
