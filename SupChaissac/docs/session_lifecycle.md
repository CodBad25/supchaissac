# Cycle de Vie des Sessions

Ce document détaille le cycle de vie complet des sessions dans l'application, depuis leur création jusqu'à leur paiement.

## 1. Types de Sessions

### RCD (Remplacement Courte Durée)
- Remplacement d'un enseignant absent
- Requiert: date, créneau horaire, classe, enseignant remplacé

### Devoirs Faits
- Accompagnement des élèves pour les devoirs
- Requiert: date, créneau horaire, niveau de classe, nombre d'élèves

### Autre
- Activités spécifiques hors RCD et Devoirs Faits
- Requiert: date, créneau horaire, description de l'activité

### HSE (Heures Supplémentaires Effectives)
- Présent dans le système mais non exposé directement aux enseignants
- Généralement géré par l'administration

## 2. Statuts de Session

### PENDING_REVIEW
- Session créée par l'enseignant
- En attente de vérification par le secrétariat
- État initial de toute nouvelle session

### PENDING_VALIDATION
- Session vérifiée par le secrétariat
- En attente de validation finale par le principal
- Étape intermédiaire du processus

### VALIDATED
- Session approuvée par le principal
- Confirmation officielle que la session est acceptée
- Permet le suivi des heures effectuées

### REJECTED
- Session refusée (par le secrétariat ou le principal)
- Des commentaires peuvent être associés pour expliquer le rejet
- État terminal (sauf si réactivation manuelle)

### PAID
- Session validée qui a été payée
- Marquée comme telle par le secrétariat
- État final du cycle de vie normal

## 3. Workflow de Validation

```
CRÉATION → PENDING_REVIEW → PENDING_VALIDATION → VALIDATED → PAID
                  ↓                    ↓
                REJECTED           REJECTED
```

### Étape 1: Création (Enseignant)
- L'enseignant remplit le formulaire de déclaration
- Choix du type de session, date, créneau horaire
- Saisie des informations spécifiques au type
- Confirmation finale avant soumission
- La session est créée avec le statut PENDING_REVIEW

### Étape 2: Vérification (Secrétariat)
- Le secrétariat examine les sessions en attente
- Vérifie l'exactitude des informations
- Options:
  - Faire passer à PENDING_VALIDATION si correct
  - Rejeter (REJECTED) si informations incorrectes
  - Laisser en PENDING_REVIEW si besoin d'informations supplémentaires

### Étape 3: Validation (Principal)
- Le principal examine les sessions marquées PENDING_VALIDATION
- Prend la décision finale:
  - Approuver (VALIDATED)
  - Rejeter (REJECTED) avec possibilité d'ajouter un commentaire
- Cette étape est critique et ne peut être effectuée que par un utilisateur avec le rôle PRINCIPAL

### Étape 4: Paiement (Secrétariat)
- Le secrétariat marque les sessions validées comme payées (PAID)
- Cette action est généralement effectuée par lot, après traitement administratif
- Représente la clôture du cycle de vie normal d'une session

## 4. Actions Spéciales

### Conversion de Sessions
- Le principal peut, dans certains cas, convertir une session d'un type à un autre
- Par exemple: convertir un RCD en HSE
- Cette conversion modifie le type mais préserve les autres métadonnées

### Commentaires et Feedback
- À chaque étape du processus, des commentaires peuvent être ajoutés
- Particulièrement importants en cas de rejet pour expliquer la décision
- Visibles par l'enseignant pour comprendre le statut de sa demande

### Édition Limitée
- Les enseignants peuvent modifier/supprimer leurs sessions uniquement:
  - Si elles sont encore en statut PENDING_REVIEW
  - Dans la limite de temps configurée par l'administrateur (ex: 24h après création)
- Cette restriction assure l'intégrité du processus de validation

## 5. Indicateurs Visuels

Les sessions sont affichées avec des codes couleur selon leur statut:
- PENDING_REVIEW: Ambre/Orange
- PENDING_VALIDATION: Bleu
- VALIDATED: Vert
- REJECTED: Rouge
- PAID: Violet

Ces indicateurs permettent une identification rapide du statut de chaque session dans les différentes interfaces.