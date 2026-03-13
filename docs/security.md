# Sécurité — SupChaissac v2

## Rotation des secrets

### SESSION_SECRET
Le secret de session chiffre les cookies d'authentification.

**Procédure de rotation :**
1. Générer un nouveau secret : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Mettre à jour la variable `SESSION_SECRET` dans l'environnement de déploiement (Oracle Cloud)
3. Redéployer l'application
4. **Impact** : tous les utilisateurs seront déconnectés (leurs cookies deviennent invalides)

**Fréquence recommandée** : tous les 6 mois ou après un incident de sécurité.

### DATABASE_URL
Contient les identifiants de connexion à Neon PostgreSQL.

**Procédure de rotation :**
1. Dans le dashboard Neon, réinitialiser le mot de passe du rôle
2. Mettre à jour `DATABASE_URL` dans l'environnement de déploiement
3. Redéployer l'application

### SMTP (EMAIL_USER / EMAIL_PASS)
Identifiants pour l'envoi d'emails d'activation.

**Procédure de rotation :**
1. Changer le mot de passe de l'application dans le fournisseur email
2. Mettre à jour `EMAIL_PASS`
3. Redéployer

## Checklist de sécurité

- [ ] `SESSION_SECRET` défini et unique en production
- [ ] CORS configuré avec `ALLOWED_ORIGINS` explicite
- [ ] Rate limiting activé (300 req/15min global, 10 req/15min sur activation)
- [ ] Mots de passe hashés avec bcrypt (12 rounds)
- [ ] Validation Zod sur toutes les entrées utilisateur
- [ ] Headers de sécurité (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Docker en mode non-root
- [ ] Pas de données sensibles dans les logs
