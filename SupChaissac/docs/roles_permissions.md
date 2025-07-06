# Rôles et Permissions

Ce document détaille les différents rôles et leurs permissions respectives dans l'application de gestion des heures d'enseignement.

## Rôle: TEACHER (Enseignant)

### Permissions
- Créer ses propres sessions (RCD, Devoirs Faits, Autre)
- Consulter uniquement ses propres sessions
- Modifier ses propres sessions (dans la limite de temps configurée)
- Supprimer ses propres sessions (dans la limite de temps configurée)
- Mettre à jour sa signature électronique
- Consulter ses statistiques personnelles et le suivi de ses heures

### Restrictions
- Ne peut pas voir les sessions des autres enseignants
- Ne peut pas modifier les sessions une fois validées
- Ne peut pas créer de sessions de type HSE directement
- Ne peut pas modifier/supprimer ses sessions après la période configurée

### Interface
- Dashboard personnel avec statistiques
- Formulaire de déclaration de sessions
- Calendrier interactif pour visualiser et créer des sessions
- Visualisation du statut des sessions (en attente, validées, rejetées)
- Distinction entre interface "avec pacte" et "sans pacte"

## Rôle: SECRETARY (Secrétariat)

### Permissions
- Consulter toutes les sessions de tous les enseignants
- Vérifier les sessions en attente de revue (PENDING_REVIEW)
- Faire passer une session de PENDING_REVIEW à PENDING_VALIDATION
- Rejeter une session (vers REJECTED)
- Marquer une session validée comme payée (PAID)
- Consulter les statistiques globales

### Restrictions
- Ne peut pas valider définitivement une session (privilège du Principal)
- Ne peut pas créer de session au nom d'un enseignant
- Ne peut pas modifier les métadonnées d'une session (seulement son statut)

### Interface
- Liste des sessions à vérifier
- Filtres par enseignant, type, statut, date
- Formulaires de vérification
- Rapports et exports
- Interface de gestion des paiements

## Rôle: PRINCIPAL (Direction)

### Permissions
- Consulter toutes les sessions de tous les enseignants
- Valider une session (PENDING_VALIDATION → VALIDATED)
- Rejeter une session avec commentaire (→ REJECTED)
- Consulter toutes les statistiques
- Suivi des contrats enseignants
- Visualiser les rapports généraux

### Restrictions
- N'a pas accès à la gestion des utilisateurs (réservé à l'Admin)
- Ne peut pas marquer une session comme payée (rôle du secrétariat)

### Interface
- Liste des sessions à valider
- Statistiques globales et par enseignant
- Historique des actions
- Suivi des contrats et des heures
- Filtres avancés par enseignant, période, etc.

## Rôle: ADMIN (Administrateur)

### Permissions
- Gérer les utilisateurs (créer, modifier, désactiver)
- Importer des données depuis CSV/PRONOTE
- Configurer les paramètres système
- Définir les règles de workflow (délais de modification, etc.)
- Voir les journaux d'activité

### Restrictions
- **Ne peut pas valider de sessions** (séparation des responsabilités)
- N'intervient pas dans le processus de validation des heures

### Interface
- Gestion des utilisateurs
- Import PRONOTE
- Paramètres système
- Interface simplifiée concentrée sur les tâches administratives

## Séparation des Responsabilités

La séparation claire entre les rôles ADMIN et PRINCIPAL est une spécificité importante du système:
- L'ADMIN gère la plateforme mais n'intervient pas dans la validation des heures
- Le PRINCIPAL est le seul à pouvoir valider définitivement les sessions
- Cette séparation garantit l'intégrité du processus de validation des heures

## Flux d'Approbation
1. L'enseignant crée une session → PENDING_REVIEW
2. Le secrétariat vérifie → PENDING_VALIDATION
3. Le principal approuve → VALIDATED
4. Le secrétariat marque comme payée → PAID

Cette chaîne d'approbation assure un contrôle à plusieurs niveaux et une traçabilité complète.