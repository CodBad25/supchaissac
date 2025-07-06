# 📋 Fonctionnalités - SupChaissac

## 🎯 Vue d'ensemble

SupChaissac est une application de gestion des heures supplémentaires pour les établissements scolaires, offrant un workflow complet de déclaration, validation et suivi des remplacements.

## 👥 Rôles et Permissions

### **🎓 Enseignant (TEACHER)**
- ✅ Déclarer ses heures supplémentaires
- ✅ Consulter ses sessions déclarées
- ✅ Modifier ses sessions en attente
- ✅ Configurer ses préférences (matières, créneaux)
- ❌ Valider les sessions d'autres enseignants

### **📝 Secrétaire (SECRETARY)**
- ✅ Consulter toutes les sessions
- ✅ Effectuer la première validation (REVIEW)
- ✅ Ajouter des commentaires de révision
- ✅ Rejeter des sessions avec motif
- ❌ Validation finale (réservée au Principal)

### **🏛️ Principal (PRINCIPAL)**
- ✅ Toutes les permissions du Secrétaire
- ✅ Validation finale des sessions (VALIDATION)
- ✅ Vue d'ensemble de l'établissement
- ✅ Rapports et statistiques
- ❌ Gestion des paiements (réservée à l'Admin)

### **⚙️ Administrateur (ADMIN)**
- ✅ Toutes les permissions
- ✅ Gestion des utilisateurs
- ✅ Configuration système
- ✅ Marquer les sessions comme payées
- ✅ Accès aux paramètres avancés

## 🔄 Workflow des Sessions

### **États des Sessions**

```
PENDING_REVIEW → PENDING_VALIDATION → VALIDATED → PAID
      ↓                  ↓              ↓         ↓
  Secrétaire         Principal       Admin     Admin
```

#### **1. PENDING_REVIEW (En attente de révision)**
- **Créée par** : Enseignant
- **Action requise** : Révision par le Secrétaire
- **Modifications** : Possibles par l'enseignant (dans la limite de temps)

#### **2. PENDING_VALIDATION (En attente de validation)**
- **Validée par** : Secrétaire
- **Action requise** : Validation finale par le Principal
- **Modifications** : Interdites

#### **3. VALIDATED (Validée)**
- **Validée par** : Principal
- **Action requise** : Traitement du paiement par l'Admin
- **Modifications** : Interdites

#### **4. PAID (Payée)**
- **Marquée par** : Administrateur
- **État final** : Aucune action requise
- **Modifications** : Interdites

#### **5. REJECTED (Rejetée)**
- **Rejetée par** : Secrétaire ou Principal
- **Motif** : Obligatoire
- **Action** : L'enseignant peut créer une nouvelle session

## 📅 Gestion des Sessions

### **Création de Session**

#### **Informations obligatoires**
- **Date** : Date du remplacement
- **Créneau** : M1, M2, M3, M4, S1, S2, S3, S4
- **Type** : RCD, DEVOIRS_FAITS, HSE, AUTRE
- **Classes** : Classes concernées
- **Matière** : Matière enseignée
- **Description** : Détails du remplacement

#### **Informations automatiques**
- **Enseignant** : Utilisateur connecté
- **Statut PACTE** : Selon le profil enseignant
- **Date de création** : Horodatage automatique
- **Statut initial** : PENDING_REVIEW

### **Modification de Session**

#### **Règles de modification**
- ✅ **Possible** : Sessions en PENDING_REVIEW
- ✅ **Délai** : 60 minutes après création (configurable)
- ❌ **Impossible** : Sessions validées ou en cours de validation

#### **Champs modifiables**
- Date et créneau
- Type de session
- Classes et matière
- Description

### **Suppression de Session**
- ✅ **Possible** : Sessions en PENDING_REVIEW uniquement
- ✅ **Délai** : Même règle que la modification
- 🗑️ **Suppression définitive** : Pas de corbeille

## 🎛️ Fonctionnalités par Interface

### **📊 Tableau de Bord**

#### **Vue Enseignant**
- **Mes sessions récentes** : 5 dernières sessions
- **Sessions en attente** : Nécessitant une action
- **Statistiques personnelles** : Heures du mois, total
- **Raccourcis** : Nouvelle session, préférences

#### **Vue Administrative**
- **Sessions à traiter** : En attente de validation
- **Statistiques globales** : Toutes les sessions
- **Activité récente** : Dernières actions
- **Alertes** : Sessions en retard, problèmes

### **📋 Liste des Sessions**

#### **Filtres disponibles**
- **Par statut** : Tous, En attente, Validées, Payées, Rejetées
- **Par enseignant** : Sélection multiple
- **Par période** : Date de début et fin
- **Par type** : RCD, DEVOIRS_FAITS, HSE, AUTRE

#### **Tri disponible**
- **Par date** : Croissant/décroissant
- **Par statut** : Groupement par état
- **Par enseignant** : Ordre alphabétique
- **Par création** : Plus récentes en premier

#### **Actions en lot**
- **Export** : PDF, Excel (à implémenter)
- **Validation multiple** : Pour les administrateurs
- **Notifications** : Rappels par email

### **📝 Formulaire de Session**

#### **Validation en temps réel**
- **Date** : Pas dans le futur lointain
- **Créneau** : Selon les créneaux définis
- **Classes** : Format standardisé
- **Description** : Minimum 10 caractères

#### **Aide contextuelle**
- **Tooltips** : Explication des champs
- **Exemples** : Formats attendus
- **Suggestions** : Basées sur l'historique

## ⚙️ Configuration et Préférences

### **Préférences Enseignant**

#### **Matières préférées**
- **Sélection multiple** : Liste des matières
- **Ordre de préférence** : Drag & drop
- **Suggestions** : Lors de la création de sessions

#### **Créneaux disponibles**
- **Sélection** : Créneaux où l'enseignant peut intervenir
- **Contraintes** : Selon l'emploi du temps
- **Notifications** : Alertes pour créneaux libres

#### **Paramètres de notification**
- **Email** : Changements de statut
- **Fréquence** : Immédiate, quotidienne, hebdomadaire
- **Types** : Validation, rejet, paiement

### **Configuration Système**

#### **Paramètres généraux**
- **Délai de modification** : Fenêtre d'édition des sessions
- **Créneaux horaires** : Définition des M1-M4, S1-S4
- **Types de sessions** : Personnalisation des types
- **Matières** : Liste des matières disponibles

#### **Workflow**
- **Étapes de validation** : Activation/désactivation
- **Rôles requis** : Attribution des permissions
- **Notifications automatiques** : Configuration des alertes

## 📊 Rapports et Statistiques

### **Rapports Individuels**
- **Récapitulatif mensuel** : Heures par enseignant
- **Détail des sessions** : Liste complète avec statuts
- **Évolution** : Graphiques sur plusieurs mois

### **Rapports Globaux**
- **Vue d'ensemble** : Toutes les sessions de l'établissement
- **Répartition par type** : RCD, DEVOIRS_FAITS, etc.
- **Charge de travail** : Répartition entre enseignants
- **Coûts** : Estimation des montants (à implémenter)

### **Exports**
- **PDF** : Rapports formatés pour impression
- **Excel** : Données pour analyse
- **CSV** : Import dans d'autres systèmes

## 🔐 Sécurité et Audit

### **Traçabilité**
- **Historique complet** : Toutes les modifications
- **Horodatage** : Date et heure précises
- **Utilisateur** : Qui a fait quoi
- **Commentaires** : Justifications des actions

### **Contrôles d'accès**
- **Authentification** : Login/mot de passe
- **Sessions** : Expiration automatique
- **Permissions** : Basées sur les rôles
- **Audit** : Logs des actions sensibles

### **Protection des données**
- **Chiffrement** : Mots de passe hachés
- **Validation** : Données côté client et serveur
- **Sauvegarde** : Base de données persistante
- **RGPD** : Respect de la vie privée (à compléter)

## 🚀 Fonctionnalités Futures

### **Priorité Haute**
- **Notifications email** : Alertes automatiques
- **Export PDF** : Rapports formatés
- **Recherche avancée** : Filtres complexes
- **Calendrier visuel** : Vue mensuelle/hebdomadaire

### **Priorité Moyenne**
- **Application mobile** : PWA ou native
- **Intégration EDT** : Import emplois du temps
- **Signatures électroniques** : Validation numérique
- **API publique** : Intégration avec d'autres systèmes

### **Priorité Basse**
- **Gestion des remplaçants** : Pool d'enseignants
- **Planification automatique** : IA pour l'attribution
- **Facturation** : Calcul automatique des montants
- **Multi-établissements** : Gestion centralisée
