# Documentation de l'Application de Gestion des Heures d'Enseignement

## Introduction

Cette application a été développée pour faciliter la gestion des heures d'enseignement et des remplacements au sein des établissements scolaires. Elle permet aux enseignants de déclarer leurs heures effectuées, aux secrétaires de traiter ces déclarations, et à la direction de valider les heures avant leur transmission pour paiement.

## Rôles et Fonctionnalités

### Enseignant
- Déclaration d'heures de remplacement (RCD)
- Déclaration d'heures "Devoirs Faits"
- Déclaration d'autres types d'activités
- Consultation du cumul d'heures
- Suivi du pacte enseignant (si applicable)
- Signature numérique des fiches

### Secrétariat
- Validation préliminaire des heures déclarées
- Consultation de toutes les déclarations
- Génération de rapports

### Direction
- Validation finale des heures
- Consultations des statistiques
- Suivi du budget des heures

### Administrateur
- Gestion des utilisateurs
- Configuration des paramètres système
- Import des données depuis PRONOTE

## Interface Utilisateur

### Tableau de Bord
Chaque rôle dispose d'un tableau de bord adapté à ses besoins spécifiques:
- Les enseignants voient leurs propres déclarations et leur cumul d'heures
- Le secrétariat et la direction ont accès à une vue globale
- Les administrateurs ont accès aux outils de configuration

### Calendrier
Le calendrier offre une vue mensuelle des sessions programmées avec des codes couleur:
- Vert: Sessions validées
- Orange: Sessions en attente de validation
- Rouge: Sessions rejetées

### Formulaire de Déclaration
Le formulaire permet de déclarer:
- La date et le créneau horaire
- Le type d'activité (RCD, Devoirs Faits, etc.)
- Le niveau concerné (6e, 5e, 4e, 3e)
- La classe
- La matière enseignée
- Le nombre d'élèves
- Un commentaire optionnel

## Workflow de Validation

1. L'enseignant soumet une déclaration d'heures
2. La déclaration passe en statut "En attente" (PENDING_REVIEW)
3. Dans les X minutes (paramétrable), l'enseignant peut encore modifier sa déclaration
4. Le secrétariat examine la déclaration et peut:
   - La renvoyer à l'enseignant pour modification
   - La transmettre à la direction pour validation finale
5. La direction valide définitivement la déclaration
6. La déclaration est comptabilisée pour le paiement

## Configuration Système

### Paramètres Modifiables
- Délai de modification (SESSION_EDIT_WINDOW): Temps en minutes pendant lequel un enseignant peut modifier sa déclaration après soumission
- Autres paramètres selon les besoins de l'établissement

### Import de Données
L'application permet d'importer:
- Liste des enseignants
- Liste des classes
- Planning des enseignants

## Sécurité
- Authentification obligatoire
- Séparation stricte des rôles
- Les enseignants ne peuvent voir et modifier que leurs propres déclarations
- Traçabilité des modifications (horodatage, utilisateur)

## Export de Données
L'application permet d'exporter:
- Les déclarations d'heures au format PDF
- Des rapports statistiques au format PDF ou Excel

## Support Technique
Pour toute question ou problème technique, veuillez contacter l'administrateur système de votre établissement.