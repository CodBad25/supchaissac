# SupChaissac v2.0

Application de gestion des heures supplémentaires pour le Collège Gaston Chaissac.

## Présentation

SupChaissac permet aux enseignants de déclarer leurs heures supplémentaires (RCD, Devoirs Faits, HSE) et de suivre leur validation par l'administration.

### Fonctionnalités principales

- **Déclaration des heures** : Calendrier interactif pour déclarer les sessions
- **Workflow de validation** : Circuit de validation Secrétariat → Direction
- **Suivi PACTE** : Gestion des contrats PACTE pour les enseignants concernés
- **Pièces jointes** : Upload de documents justificatifs (S3)
- **Recherche intelligente** : Autocomplétion des enseignants remplacés

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Backend** | Express.js + Passport.js |
| **Base de données** | PostgreSQL (Neon) |
| **Stockage fichiers** | Scaleway Object Storage (S3) |
| **Déploiement** | Scaleway Serverless Containers |

## Rôles utilisateurs

| Rôle | Permissions |
|------|-------------|
| **Enseignant** | Déclarer ses sessions, voir son dashboard, upload pièces jointes |
| **Secrétariat** | Vérifier les sessions, gérer les contrats PACTE, mettre en paiement |
| **Direction** | Valider/rejeter les sessions, convertir en HSE |
| **Admin** | Gestion des utilisateurs, import CSV, configuration |

## Types de sessions

| Type | Description | Couleur |
|------|-------------|---------|
| **RCD** | Remplacement Courte Durée | Violet |
| **Devoirs Faits** | Aide aux devoirs | Bleu |
| **HSE** | Heures Supplémentaires Effectives | Rose |
| **Autre** | Autre type de session | Ambre |

## Workflow de validation

```
Enseignant crée session
        ↓
   PENDING_REVIEW
        ↓
Secrétariat vérifie
        ↓
 PENDING_VALIDATION
        ↓
Direction valide ──→ VALIDATED ──→ PAID
        ↓
    REJECTED
```

## Installation

```bash
# Cloner le projet
git clone https://github.com/CodBad25/supchaissac.git
cd supchaissac

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos credentials

# Pousser le schéma vers la base de données
npm run db:push

# Lancer en développement
npm run dev:full
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev:full` | Lance frontend + backend en développement |
| `npm run build` | Build de production |
| `npm run db:push` | Pousse le schéma vers la BDD |
| `npm run db:seed` | Insère les données de test |

## Documentation

- [Guide Utilisateur](./docs/GUIDE-UTILISATEUR.md) - Comment utiliser l'application
- [Documentation API](./docs/API.md) - Liste des endpoints
- [Guide de Déploiement](./docs/DEPLOIEMENT.md) - Déployer sur Scaleway

## Comptes de démonstration

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| teacher1@example.com | password123 | Enseignant |
| secretary@example.com | password123 | Secrétariat |
| principal@example.com | password123 | Direction |
| admin@example.com | password123 | Admin |

## Sécurité

- Authentification par session avec cookies sécurisés
- Rate limiting sur la connexion (5 tentatives / 15 min)
- Headers de sécurité (CSP, HSTS, X-Frame-Options)
- Validation des données côté serveur (Zod)
- Vérification des permissions sur chaque route

## Licence

Projet développé pour le Collège Gaston Chaissac - Usage interne.
