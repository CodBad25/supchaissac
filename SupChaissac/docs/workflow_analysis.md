# Analyse du Workflow de l'Application de Gestion des Heures d'Enseignement

## 1. Architecture Générale

L'application est une application web full-stack construite avec les technologies suivantes:
- **Frontend**: React, Tailwind CSS, Shadcn/UI
- **Backend**: Express.js (Node.js)
- **Base de données**: PostgreSQL (via Drizzle ORM)
- **Authentification**: Basée sur les sessions

## 2. Modèle de Données

### Utilisateurs (Users)
- Rôles distincts: `TEACHER`, `SECRETARY`, `PRINCIPAL`, `ADMIN`
- Chaque utilisateur possède un nom, un identifiant unique, un mot de passe, des initiales
- Les enseignants peuvent stocker leur signature électronique
- Distinction entre enseignants "en pacte" et autres enseignants

### Sessions
- Types: `RCD` (Remplacement Courte Durée), `DEVOIRS_FAITS`, `HSE`, `AUTRE`
- Créneaux horaires: M1, M2, M3, M4 (matin), S1, S2, S3, S4 (après-midi)
- Statuts: `PENDING_REVIEW`, `PENDING_VALIDATION`, `VALIDATED`, `REJECTED`, `PAID`
- Métadonnées: date, classe, nombre d'élèves, enseignant remplacé, etc.

### Configuration des Enseignants (TeacherSetup)
- Indique si l'enseignant est "en pacte" ou non
- Paramètres spécifiques liés au suivi des heures

### Paramètres Système (SystemSettings)
- Paramètres globaux configurable par les administrateurs

## 3. Flux de Validation des Sessions

1. **Création** (Enseignant):
   - L'enseignant crée une session (remplacement, devoirs faits, autre)
   - La session prend le statut `PENDING_REVIEW`

2. **Vérification** (Secrétariat):
   - Le secrétariat examine la session
   - Peut la faire passer à `PENDING_VALIDATION` pour approbation finale
   - Peut la rejeter directement (`REJECTED`)

3. **Validation** (Direction):
   - Le principal/directeur examine les sessions marquées `PENDING_VALIDATION`
   - Peut les valider (`VALIDATED`) ou les rejeter (`REJECTED`)
   - Peut ajouter des commentaires/feedback lors de la validation

4. **Paiement** (Secrétariat):
   - Les sessions validées peuvent être marquées comme payées (`PAID`)
   - Étape finale du cycle de vie d'une session

## 4. Interfaces Par Rôle

### Interface Enseignant
- **Dashboard**: Vue résumée des sessions, statut des heures
- **Déclaration**: Formulaire pour déclarer de nouvelles sessions
- **Calendrier**: Visualisation des sessions par date
- Distinction entre enseignants "en pacte" et autres en termes d'affichage

### Interface Secrétariat
- Vue des sessions en attente de vérification
- Possibilité de filtrer par enseignant, date, statut
- Formulaires de vérification des informations
- Gestion du statut "payé" des sessions validées

### Interface Direction (Principal)
- Vue d'ensemble des sessions à valider
- Statistiques de validation
- Historique des actions récentes
- Suivi des contrats des enseignants

### Interface Administrateur
- Gestion des utilisateurs (création, modification)
- Import CSV depuis PRONOTE
- Configuration des paramètres système
- Pas d'accès à la validation des sessions (séparation des responsabilités)

## 5. Particularités Importantes

### Système de Couleurs
- Niveaux de classe: 6ème (vert), 5ème (bleu), 4ème (violet), 3ème (rouge)
- Statuts: Validé (vert), En attente (ambre), Rejeté (rouge), Payé (violet)

### Sécurité
- Les enseignants ne peuvent modifier que leurs propres sessions
- Restriction temporelle pour les modifications (configurable)
- Séparation stricte des responsabilités entre administrateur et principal

### Accessibilité
- Interface responsive (mobile-first)
- Version française uniquement
- Optimisation pour différents appareils

### Workflow Opérationnel
1. Les enseignants créent des sessions
2. Le secrétariat vérifie les informations
3. La direction valide ou rejette
4. Le secrétariat gère les paiements
5. Les administrateurs gèrent les utilisateurs et la configuration

### Types de Sessions pour les Enseignants
- **RCD**: Remplacement de Courte Durée
- **Devoirs Faits**: Accompagnement pour les devoirs
- **Autre**: Activités spécifiques

*Note: Les sessions HSE existent dans la base de données mais ne sont pas exposées directement aux enseignants dans l'interface utilisateur.*

## 6. Fonctionnalités Clés

- **Signature électronique**: Les enseignants peuvent signer électroniquement leurs sessions
- **Export PDF**: Génération de rapports PDF des sessions
- **Sélecteur de rôle**: Pour faciliter les tests (mode démo)
- **Confirmation modale**: Résumé des informations avant soumission finale
- **Import PRONOTE**: Synchronisation des données utilisateurs
- **Gestion automatique des statuts**: Workflow guidé par les rôles