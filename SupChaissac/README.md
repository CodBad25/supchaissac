# SupChaissac - Application de gestion des heures supplémentaires

Cette application permet de gérer les heures supplémentaires des enseignants dans un établissement scolaire. Elle a été améliorée pour offrir une meilleure expérience utilisateur et une meilleure maintenabilité du code.

## 🚀 Démarrage rapide

### Prérequis

- Node.js (version 14 ou supérieure)
- npm (inclus avec Node.js)

### Installation et lancement

#### Windows

1. Double-cliquez sur le fichier `start-app.bat`
2. Le script installera les dépendances et démarrera le serveur de développement
3. Votre navigateur s'ouvrira automatiquement à l'adresse http://localhost:3000

#### macOS / Linux

1. Ouvrez un terminal dans le répertoire du projet
2. Rendez le script exécutable : `chmod +x start-app.sh`
3. Exécutez le script : `./start-app.sh`
4. Votre navigateur s'ouvrira automatiquement à l'adresse http://localhost:3000

#### Manuellement

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## 🔑 Connexion à l'application

Pour la démo, vous pouvez vous connecter avec n'importe quel nom d'utilisateur et mot de passe. L'application vous connectera automatiquement en tant que secrétaire.

## 📱 Fonctionnalités principales

- **Tableau de bord** : Vue d'ensemble des sessions avec statistiques
- **Validation des heures** : Interface pour valider ou rejeter les sessions soumises
- **Historique** : Consultation de l'historique des sessions validées et rejetées
- **Détail des sessions** : Affichage détaillé des informations de chaque session
- **Responsive design** : Interface adaptée aux appareils mobiles

## 🛠️ Améliorations techniques apportées

### 1. Hooks personnalisés

- **useSessionManagement** : Centralise toute la logique de gestion des sessions (création, mise à jour, suppression, validation, rejet)
- **useIsMobile** : Détecte si l'appareil est mobile pour adapter l'interface utilisateur
- **useAuth** : Gère l'authentification des utilisateurs
- **useToast** : Affiche des notifications à l'utilisateur

### 2. Composants réutilisables

- **StatusBadge** et **SessionTypeBadge** : Affichent des badges visuels cohérents pour les statuts et types de sessions
- **SessionTable** : Affiche un tableau de sessions avec pagination et filtrage
- **SessionDetailModal** : Affiche les détails d'une session dans une modale

### 3. Refactorisation des composants existants

- **SecretaryView** : Utilise les nouveaux hooks et composants pour une meilleure séparation des préoccupations
- **TeacherView** : À venir
- **PrincipalView** : À venir

### 4. Améliorations générales

- **Typage TypeScript renforcé** : Ajout d'interfaces et de types pour les sessions, les pièces jointes, etc.
- **Pagination** : Ajout d'une pagination pour les tableaux de sessions
- **Responsive design** : Adaptation de l'interface aux appareils mobiles
- **Gestion des erreurs** : Amélioration de la gestion des erreurs avec des messages explicites

## 📂 Structure des fichiers

```
SupChaissac/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── sessions/
│   │   │   │   ├── session-table.tsx       # Tableau de sessions
│   │   │   │   └── session-detail-modal.tsx # Modale de détail
│   │   │   ├── ui/
│   │   │   │   └── status-badge.tsx        # Badges de statut et type
│   │   │   ├── secretary/
│   │   │   │   └── SecretaryComponents.tsx # Vue secrétariat
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── use-auth.tsx               # Authentification
│   │   │   ├── use-session-management.tsx # Gestion des sessions
│   │   │   ├── use-mobile.tsx             # Détection mobile
│   │   │   └── use-toast.tsx              # Notifications
│   │   ├── data/
│   │   │   └── mockData.ts                # Données de test
│   │   ├── lib/
│   │   │   └── queryClient.ts             # Configuration de React Query
│   │   ├── App.tsx                        # Composant racine
│   │   ├── main.tsx                       # Point d'entrée
│   │   └── index.css                      # Styles globaux
│   └── ...
├── preview.html                           # Aperçu HTML statique
├── codepen-link.md                        # Lien vers l'aperçu en ligne
├── start-app.bat                          # Script de démarrage Windows
├── start-app.sh                           # Script de démarrage macOS/Linux
├── package.json                           # Dépendances
├── tsconfig.json                          # Configuration TypeScript
├── vite.config.ts                         # Configuration Vite
└── README.md                              # Ce fichier
```

## 🌟 Avantages des améliorations

1. **Structure modulaire** : Les composants et hooks réutilisables permettent une meilleure organisation du code
2. **Réduction de la duplication** : La logique commune est extraite dans des hooks personnalisés
3. **Typage renforcé** : Utilisation systématique des types TypeScript pour éviter les erreurs
4. **Responsive design** : L'interface s'adapte aux appareils mobiles
5. **Pagination** : Les tableaux de sessions incluent une pagination pour améliorer les performances
6. **Filtrage intégré** : Possibilité de filtrer les sessions par statut, type, date, etc.
7. **Interface utilisateur cohérente** : Utilisation de composants réutilisables pour les badges, tableaux, etc.
8. **Gestion d'état centralisée** : Le hook `useSessionManagement` centralise toute la logique de gestion des sessions

## 🔍 Aperçu visuel

Vous pouvez visualiser un aperçu de l'application améliorée en ligne sur CodePen :

[Aperçu de l'application SupChaissac améliorée sur CodePen](https://codepen.io/cline-ai/pen/QWPeRLO)

## 🔮 Prochaines étapes

- Refactoriser les composants TeacherView et PrincipalView pour utiliser les nouveaux hooks et composants
- Ajouter des tests unitaires et d'intégration
- Améliorer la gestion des erreurs et la validation des données
- Ajouter des fonctionnalités de recherche et de filtrage avancées
- Implémenter un mode hors ligne avec synchronisation
