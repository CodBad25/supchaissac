# Documentation du Workflow de l'Application

## Table des Matières

1. [Analyse du Workflow](workflow_analysis.md)
   - Architecture générale
   - Modèle de données
   - Flux de validation
   - Interfaces par rôle
   - Particularités importantes
   - Fonctionnalités clés

2. [Rôles et Permissions](roles_permissions.md)
   - Détail des rôles (Enseignant, Secrétariat, Direction, Admin)
   - Permissions par rôle
   - Restrictions spécifiques
   - Interfaces associées
   - Séparation des responsabilités

3. [Cycle de Vie des Sessions](session_lifecycle.md)
   - Types de sessions
   - Statuts possibles
   - Workflow de validation
   - Actions spéciales
   - Indicateurs visuels

4. [Interfaces Utilisateur](interfaces_utilisateur.md)
   - Interface Enseignant
   - Interface Secrétariat
   - Interface Direction
   - Interface Administrateur
   - Éléments communs

5. [Mode Démo et Sélecteur de Rôle](mode_demo.md)
   - Objectif du mode démo
   - Implémentation
   - Structure
   - Rôles disponibles
   - Distinction et utilisation

## Introduction

Cette documentation présente l'analyse complète du workflow de l'application de gestion des heures d'enseignement, en détaillant son architecture, ses fonctionnalités et ses processus métier.

L'objectif est de fournir une vision claire du fonctionnement global du système et des interactions entre les différentes composantes.

## Caractéristiques Principales

- **Gestion par rôle**: Séparation claire des responsabilités entre les différents acteurs
- **Workflow structuré**: Processus défini pour la validation des sessions
- **Interface adaptative**: Design responsive pour tous les types d'appareils
- **Mode démonstration**: Possibilité de tester toutes les interfaces via un sélecteur de rôle
- **Sécurité intégrée**: Contrôles d'autorisation à plusieurs niveaux

## Comment Utiliser Cette Documentation

Cette documentation est organisée de manière à vous permettre d'explorer les différents aspects du système:

- Commencez par l'[Analyse du Workflow](workflow_analysis.md) pour une vision d'ensemble
- Explorez les [Rôles et Permissions](roles_permissions.md) pour comprendre les différents acteurs
- Approfondissez le [Cycle de Vie des Sessions](session_lifecycle.md) pour maîtriser le processus métier
- Consultez les [Interfaces Utilisateur](interfaces_utilisateur.md) pour comprendre l'expérience utilisateur
- Découvrez le [Mode Démo](mode_demo.md) pour faciliter les tests et présentations

Chaque section peut être consultée indépendamment, mais elles forment ensemble une documentation complète du système.