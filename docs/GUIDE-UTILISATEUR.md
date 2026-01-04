# Guide Utilisateur - SupChaissac v2.0

## Table des matières

1. [Connexion](#connexion)
2. [Interface Enseignant](#interface-enseignant)
3. [Interface Secrétariat](#interface-secrétariat)
4. [Interface Direction](#interface-direction)
5. [Interface Admin](#interface-admin)

---

## Connexion

### Accéder à l'application

1. Ouvrez votre navigateur et accédez à l'URL de l'application
2. Sur la page de connexion, vous verrez :
   - Un formulaire de connexion (email + mot de passe)
   - Des comptes de démonstration pour tester

### Mode Test vs Mode Réel

- **Mode Test** : Affiche les comptes de démonstration pour un accès rapide
- **Mode Réel** : Masque les comptes de démonstration, connexion classique

### Première connexion

Si vous recevez un lien d'activation par email :
1. Cliquez sur le lien dans l'email
2. Créez votre mot de passe (minimum 8 caractères)
3. Connectez-vous avec votre email et nouveau mot de passe

---

## Interface Enseignant

### Dashboard

Après connexion, vous accédez à votre tableau de bord personnel :

- **Statistiques** : Nombre de sessions déclarées, validées, en attente
- **Progression PACTE** (si concerné) : Pourcentage d'heures effectuées
- **Sessions récentes** : Vos dernières déclarations

### Calendrier

Le calendrier est l'outil principal pour déclarer vos heures :

#### Vue Semaine
- Affiche du lundi au vendredi
- Créneaux : M1, M2, M3, M4 (matin) et S1, S2, S3, S4 (après-midi)
- Cliquez sur un créneau pour déclarer une session

#### Vue Mois
- Vue d'ensemble du mois
- Cliquez sur un jour pour déclarer une session
- Les jours avec sessions existantes sont marqués

#### Navigation
- Flèches gauche/droite pour changer de semaine/mois
- Bouton "Aujourd'hui" pour revenir à la date actuelle

### Déclarer une session

1. **Cliquez sur un créneau** dans le calendrier
2. **Choisissez le type** :
   - **RCD** (Remplacement Courte Durée) : Vous remplacez un collègue
   - **Devoirs Faits** : Aide aux devoirs
   - **Autre** : Autre type d'intervention

3. **Remplissez le formulaire** selon le type :

#### Pour un RCD :
- Classe concernée (ex: 6A, 5B)
- Enseignant remplacé (recherche par nom)
- Matière enseignée

#### Pour Devoirs Faits :
- Niveau (6ème, 5ème, 4ème, 3ème)
- Nombre d'élèves
- Liste des élèves (optionnel)

#### Pour Autre :
- Description de l'intervention

4. **Validez** la déclaration

### Ajouter des pièces jointes

Pour certaines sessions, vous pouvez ajouter des justificatifs :

1. Cliquez sur une session existante
2. Dans la section "Pièces jointes", cliquez sur "Ajouter"
3. Sélectionnez votre fichier (PDF, image, etc.)
4. Le fichier est uploadé et associé à la session

### Modifier une session

Vous pouvez modifier une session tant qu'elle est en statut "En attente de vérification" :

1. Cliquez sur la session dans le calendrier
2. Modifiez les informations
3. Enregistrez

### Supprimer une session

1. Cliquez sur la session
2. Cliquez sur "Supprimer"
3. Confirmez la suppression

---

## Interface Secrétariat

### Dashboard

- **Sessions à vérifier** : Nombre de sessions en attente
- **Sessions vérifiées ce mois** : Statistiques mensuelles
- **Alertes** : Sessions urgentes ou en retard

### Vérification des sessions

1. Accédez à l'onglet "Vérification"
2. Les sessions en attente sont listées
3. Pour chaque session :
   - Vérifiez les informations
   - Consultez les pièces jointes
   - Cliquez sur "Valider" pour transmettre à la Direction

### Gestion PACTE

1. Accédez à l'onglet "Contrats PACTE"
2. Liste des enseignants avec leur statut PACTE
3. Pour modifier un contrat :
   - Cliquez sur l'enseignant
   - Modifiez les heures prévues
   - Enregistrez

### Mise en paiement

Une fois les sessions validées par la Direction :

1. Accédez à l'onglet "Paiement"
2. Sélectionnez les sessions à payer
3. Cliquez sur "Marquer en paiement"

---

## Interface Direction

### Dashboard

Vue simplifiée avec 4 indicateurs clés :
- Sessions en attente de validation
- Sessions validées ce mois
- Sessions rejetées ce mois
- Enseignants actifs

### Validation des sessions

1. Accédez à l'onglet "À valider"
2. Les sessions vérifiées par le secrétariat sont listées
3. Pour chaque session :
   - **Valider** : La session est approuvée
   - **Rejeter** : Indiquez un motif de rejet
   - **Convertir en HSE** : Transforme la session en HSE

### Conversion en HSE

Certaines sessions peuvent être converties en HSE :

1. Cliquez sur la session
2. Sélectionnez "Convertir en HSE"
3. La session garde une trace du type original (ex: "RCD → HSE")

---

## Interface Admin

### Gestion des utilisateurs

1. Accédez à l'onglet "Utilisateurs"
2. Actions disponibles :
   - **Créer** : Ajouter un nouvel utilisateur
   - **Modifier** : Changer les informations (nom, email, rôle)
   - **Supprimer** : Retirer un utilisateur
   - **Réinitialiser mot de passe** : Générer un nouveau mot de passe

### Import des enseignants

Pour importer des enseignants depuis Pronote :

1. Accédez à l'onglet "Import"
2. Cliquez sur "Importer enseignants (CSV)"
3. Sélectionnez votre fichier CSV exporté de Pronote
4. Prévisualisez les données
5. Confirmez l'import

Format CSV attendu :
```
LOGIN,CIVILITE,NOM,PRENOM,EMAIL,DISCIPLINE
dupont.jean,M.,DUPONT,Jean,jean.dupont@ac-nantes.fr,MATHS
```

### Import des élèves

Pour importer la liste des élèves :

1. Accédez à l'onglet "Élèves"
2. Cliquez sur "Importer (CSV)"
3. Sélectionnez votre fichier
4. Confirmez l'import

### Envoi des liens d'activation

Pour les nouveaux utilisateurs :

1. Dans la liste des utilisateurs
2. Cliquez sur l'icône "Envoyer lien d'activation"
3. Un email est envoyé à l'utilisateur avec un lien pour créer son mot de passe

---

## Astuces

### Raccourcis clavier

- `Échap` : Fermer une modale
- `Entrée` : Valider un formulaire

### Bonnes pratiques

1. **Déclarez vos sessions rapidement** : Plus tôt vous déclarez, plus vite elles sont traitées
2. **Ajoutez des pièces jointes** si demandé par l'administration
3. **Vérifiez vos informations** avant de valider

### En cas de problème

- **Session non visible** : Rafraîchissez la page (F5)
- **Erreur de connexion** : Vérifiez vos identifiants ou contactez l'admin
- **Fichier non uploadé** : Vérifiez la taille (max 10 Mo) et le format

---

## Contact support

Pour toute question technique, contactez l'administrateur de l'application.
