# Interfaces Utilisateur

Ce document décrit les différentes interfaces utilisateur disponibles dans l'application, organisées par rôle.

## Interface Enseignant

### Navigation Principale
- **Tableau de bord**: Vue d'ensemble personnelle
- **Déclaration**: Formulaire pour déclarer de nouvelles sessions
- **Calendrier**: Vue calendrier avec sessions par jour/créneau
- **Historique**: Liste de toutes les sessions et leur statut

### Dashboard Enseignant
- Résumé du nombre de sessions par statut
- Indicateurs de progression (pour les enseignants en pacte)
- Sessions récentes avec leur statut
- Statistiques d'heures par type d'activité

### Vue Calendrier
- Affichage mensuel interactif
- Code couleur par type de session
- Créneaux horaires (M1-M4, S1-S4)
- Possibilité de cliquer sur un créneau pour déclarer une session

### Formulaire de Déclaration
1. Sélection du type de session (RCD, Devoirs Faits, Autre)
2. Champs spécifiques selon le type:
   - **RCD**: Classe, enseignant remplacé, matière
   - **Devoirs Faits**: Niveau de classe, nombre d'élèves
   - **Autre**: Description détaillée de l'activité
3. Date et créneau horaire
4. Zone de signature électronique
5. Modal de confirmation avec résumé avant soumission finale

### Particularités Enseignants "en Pacte"
- Visualisation du quota d'heures à effectuer
- Progression par type d'activité
- Distinction visuelle claire dans l'interface

## Interface Secrétariat

### Navigation Principale
- **Sessions à vérifier**: Sessions en attente de revue
- **Suivi des heures**: Vue globale des sessions par enseignant
- **Paiements**: Gestion des sessions validées à payer
- **Statistiques**: Rapports sur les heures effectuées

### Liste des Sessions à Vérifier
- Filtres par enseignant, type, date
- Actions rapides (valider/rejeter)
- Vue détaillée disponible pour chaque session
- Indicateurs de date de création pour priorisation

### Formulaire de Vérification
- Affichage de toutes les informations de la session
- Boutons pour changer le statut (PENDING_VALIDATION ou REJECTED)
- Champ de commentaire pour expliquer un rejet
- Historique des modifications

### Interface de Paiement
- Liste des sessions validées
- Possibilité de marquer comme payées (individuellement ou par lot)
- Export pour traitement administratif externe
- Filtres par période, par enseignant

## Interface Direction (Principal)

### Navigation Principale
- **Sessions à valider**: Sessions en attente de validation finale
- **Actions récentes**: Dernières validations/rejets effectués
- **Historique**: Toutes les sessions avec possibilité de filtrage avancé
- **Contrats**: Suivi des contrats enseignants
- **Statistiques**: Rapports détaillés

### Liste des Sessions à Valider
- Affichage des sessions ayant le statut PENDING_VALIDATION
- Dates de création et de vérification par le secrétariat
- Détails complets de chaque session
- Boutons d'action rapide (Valider/Rejeter)

### Formulaire de Validation
- Vue détaillée de la session
- Option de conversion de type si nécessaire
- Champ de commentaire (obligatoire en cas de rejet)
- Boutons de validation/rejet avec confirmation

### Suivi des Contrats
- Liste des enseignants avec statut (en pacte ou non)
- Progression des heures effectuées par rapport aux quotas
- Code couleur pour identifier les situations critiques
- Possibilité de filtrer par département/discipline

### Vue Statistiques
- Graphiques de répartition des sessions par type
- Évolution temporelle des heures effectuées
- Comparaison entre enseignants/départements
- Exports pour rapports administratifs

## Interface Administrateur

### Navigation Principale
- **Gestion utilisateurs**: Création et modification des comptes
- **Import PRONOTE**: Interface d'import CSV
- **Paramètres**: Configuration du système

### Gestion des Utilisateurs
- Liste complète des utilisateurs avec filtres
- Formulaire de création/modification de compte
- Attribution des rôles (TEACHER, SECRETARY, PRINCIPAL, ADMIN)
- Option pour désactiver temporairement un compte

### Import PRONOTE
- Interface de téléchargement de fichier CSV
- Prévisualisation des données à importer
- Options de correspondance des champs
- Journal d'importation avec résumé des actions effectuées

### Paramètres Système
- Configuration des délais de modification (combien de temps un enseignant peut modifier sa session)
- Paramètres d'année scolaire
- Valeurs par défaut pour les différents types de sessions
- Options de notifications

## Éléments Communs à Toutes les Interfaces

### Accessibilité Mobile
- Design responsive adapté aux smartphones et tablettes
- Simplification des interfaces sur petit écran
- Maintien des fonctionnalités essentielles en mobilité

### Notifications
- Bannières de notification pour les actions importantes
- Indicateurs visuels pour les éléments nécessitant attention
- Messages de confirmation après actions critiques

### Navigation Contextuelle
- Fil d'Ariane pour situer l'utilisateur dans l'application
- Menu latéral rétractable sur mobile
- Accès rapide aux fonctions principales

### Code Couleur Cohérent
- Types de sessions: RCD (violet), Devoirs Faits (bleu), Autre (orange)
- Statuts: En attente (ambre), Validé (vert), Rejeté (rouge), Payé (violet)
- Niveaux de classe: 6ème (vert), 5ème (bleu), 4ème (violet), 3ème (rouge)