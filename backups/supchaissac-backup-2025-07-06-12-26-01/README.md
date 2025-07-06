# Gestion des Heures Supplémentaires

Application de gestion des heures supplémentaires pour les établissements scolaires.

## Fonctionnalités

- Gestion des différents types d'heures supplémentaires (RCD, Devoirs Faits, HSE, Autre)
- Workflow de validation (soumission, vérification, validation, mise en paiement)
- Interface adaptée aux différents rôles (enseignant, secrétariat, direction, administrateur)
- Calendrier interactif
- Formulaires spécifiques selon le type de séance
- Signature électronique
- Exports PDF et Excel
- Interface responsive (ordinateur, tablette, smartphone)

## Technologies utilisées

- **Frontend** : React, TypeScript, TailwindCSS, Shadcn/UI
- **Backend** : Express.js, TypeScript
- **Base de données** : Drizzle ORM (avec stockage mémoire pour le développement)
- **Authentification** : Passport.js

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

## Comptes de test

Pour le développement, les comptes suivants sont disponibles :

- **Enseignant** : teacher1@example.com / password123
- **Secrétariat** : secretary@example.com / password123
- **Direction** : principal@example.com / password123
- **Admin** : admin@example.com / password123

## Structure du projet

- `client/` : Code source du frontend
  - `src/` : Composants React, hooks, utilitaires
    - `components/` : Composants UI
    - `hooks/` : Hooks personnalisés
    - `lib/` : Utilitaires et configuration
    - `pages/` : Pages principales
- `server/` : Code source du backend
  - `index.ts` : Point d'entrée du serveur
  - `routes.ts` : Routes API
  - `auth.ts` : Configuration de l'authentification
  - `storage.ts` : Gestion du stockage des données
- `shared/` : Code partagé entre le frontend et le backend
  - `schema.ts` : Schéma de données
- `docs/` : Documentation

## Documentation

La documentation est accessible depuis l'application via le bouton "Documentation" présent sur toutes les interfaces.

Vous pouvez également consulter :
- Le workflow de validation : `/documentation`
- La documentation complète : `/view-documentation`

## Licence

MIT
