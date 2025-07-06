
# Changelog
Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-03-21

### ✨ Améliorations
- Amélioration des indicateurs de statut avec une progression logique des couleurs :
  * Nouvelle : Gris foncé
  * En attente : Orange
  * Validée : Bleu
  * Payée : Vert
- Meilleure visibilité des pastilles de statut avec contour blanc et ombre
- Cohérence des couleurs dans tout le système (calendrier et historique)
- Affichage du nombre d'élèves pour les séances Devoirs Faits

### 🎨 Design
- Amélioration du contraste des indicateurs de statut
- Ajout d'effets visuels pour une meilleure lisibilité
- Interface plus intuitive et cohérente

## [1.0.0] - 2025-03-21

### ✨ Fonctionnalités validées
- Système de connexion multi-rôles (enseignant, secrétaire, principal)
- Interface enseignant :
  * Calendrier de saisie des heures avec créneaux M1-S4
  * Types de séances (RCD, Devoirs Faits, Autre) avec boutons élégants
  * Sélection M./Mme pour le professeur remplacé
  * Conversion automatique des noms en majuscules
  * Upload et dessin de signature
  * Génération de PDF avec les séances
  * Suivi du statut des déclarations

- Interface secrétaire :
  * Vérification des déclarations
  * Transmission au principal
  * Mise en paiement après validation
  * Suivi des statuts

- Interface principal :
  * Validation des heures
  * Suivi des statistiques
  * Vue d'ensemble des déclarations

### 🎨 Design
- Boutons de type de séance avec couleurs distinctives :
  * RCD : violet
  * Devoirs Faits : bleu
  * Autre : jaune
- Créneaux horaires organisés matin/après-midi
- Sélection très visible avec effet d'ombre et zoom
- Interface responsive et moderne
- Optimisation de l'affichage mobile pour les formulaires

### 🔄 Workflow validé
1. Enseignant : saisie des heures
2. Secrétaire : vérification et transmission au principal
3. Principal : validation
4. Secrétaire : mise en paiement

### ⚠️ Points d'attention
- La signature manuscrite dans le PDF nécessite des ajustements
- La résolution des signatures uploadées pourrait être améliorée

### 📝 Notes techniques
- Stockage local utilisé pour le prototype
- Préparé pour migration vers Supabase
- Formulaires responsifs avec validation des champs
- Gestion des documents et photos intégrée
