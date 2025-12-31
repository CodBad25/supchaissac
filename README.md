# SupChaissac v2.0

Application de gestion des heures supplémentaires pour le collège Gaston Chaissac.

## Stack technique

- **Frontend** : React + TypeScript + Vite + Tailwind CSS
- **Backend** : Express.js + Passport.js (authentification)
- **Base de données** : PostgreSQL (Neon)
- **Stockage fichiers** : Scaleway Object Storage (S3)
- **Déploiement** : Scaleway Serverless Containers

## Fonctionnalités

### Rôles utilisateurs

| Rôle | Permissions |
|------|-------------|
| **TEACHER** | Déclarer ses sessions, voir son dashboard |
| **SECRETARY** | Vérifier les sessions, marquer en paiement |
| **PRINCIPAL** | Valider/rejeter les sessions, convertir en HSE |
| **ADMIN** | Toutes les permissions |

### Types de sessions

- **RCD** : Remplacement Courte Durée (violet)
- **DEVOIRS_FAITS** : Aide aux devoirs (bleu)
- **HSE** : Heures Supplémentaires Effectives (rose) - conversion par le Principal
- **AUTRE** : Autre type de session (ambre)

### Statuts des sessions

```
PENDING_REVIEW → PENDING_VALIDATION → VALIDATED → PAID
                                   ↘ REJECTED
```

## Changelog

### 31/12/2024 - Optimisation mobile et traçabilité HSE

#### Nouvelles fonctionnalités

1. **Traçabilité des conversions HSE**
   - Ajout du champ `originalType` en base de données
   - Quand le Principal convertit une session (ex: RCD → HSE), le type original est sauvegardé
   - Affichage "RCD → HSE" dans les sessions récentes pour les sessions converties

2. **Nouveau layout dashboard enseignant PACTE**
   - Deux cadres noirs en haut (ratio 60/40) :
     - Gauche : Nombre de sessions déclarées + stats (validées, en attente, en paiement)
     - Droite : Cercle doré avec pourcentage de progression PACTE
   - Carte "Mon contrat PACTE" simplifiée avec barre de progression et boutons DF/RCD/HSE

3. **Header amélioré**
   - Nom et prénom de l'enseignant affichés à côté du logo
   - Badge PACTE visible sur toutes les tailles d'écran

#### Optimisations mobile

- Réduction des paddings et tailles de texte sur mobile
- Grille 3 colonnes pour DF/RCD/HSE même sur mobile
- Sessions récentes plus compactes
- Section "Mes semaines" optimisée

#### Corrections

- Suppression de la section "Suivi PACTE" redondante (13h/33h qui était incohérent)
- Le pourcentage PACTE est maintenant calculé correctement : `(heures antérieures + sessions app) / total contrat`

### Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `src/lib/schema.ts` | Ajout champ `originalType` pour tracer les conversions |
| `server/routes/sessions.ts` | Sauvegarde du type original lors des conversions |
| `src/pages/TeacherDashboard.tsx` | Nouveau layout, optimisation mobile, affichage conversions |

## Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos credentials

# Pousser le schéma vers la base de données
npx drizzle-kit push

# Lancer en développement
npm run dev
```

## Variables d'environnement

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=...
S3_ENDPOINT=https://s3.fr-par.scw.cloud
S3_REGION=fr-par
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=supchaissac
```

## Comptes de test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| teacher1@example.com | password123 | TEACHER |
| secretary@example.com | password123 | SECRETARY |
| principal@example.com | password123 | PRINCIPAL |
| admin@example.com | password123 | ADMIN |
