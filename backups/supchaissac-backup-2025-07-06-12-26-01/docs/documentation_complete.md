# Documentation complète - Gestion des Heures Supplémentaires

## Introduction

L'application "Gestion des Heures Supplémentaires" est un outil conçu pour simplifier et automatiser la gestion des heures supplémentaires des enseignants dans un établissement scolaire. Elle permet de suivre l'ensemble du processus, de la déclaration initiale par l'enseignant jusqu'à la mise en paiement.

## Types de séances

L'application gère plusieurs types de séances d'heures supplémentaires :

### RCD (Remplacement de Courte Durée)

Les RCD sont des remplacements ponctuels d'enseignants absents. Pour déclarer un RCD, l'enseignant doit fournir :
- La classe concernée
- L'enseignant remplacé (nom, prénom)
- Un commentaire optionnel (motif du remplacement, etc.)

### Devoirs Faits

Le dispositif "Devoirs Faits" permet aux élèves de bénéficier d'une aide pour leurs devoirs. Pour déclarer une séance Devoirs Faits, l'enseignant doit fournir :
- Le niveau concerné (6e, 5e, 4e, 3e)
- Le nombre d'élèves présents
- Un commentaire optionnel

### HSE (Heures Supplémentaires Effectives)

Les HSE sont des heures supplémentaires classiques. Pour déclarer une HSE, l'enseignant doit fournir :
- La nature de l'activité
- Un commentaire optionnel

### Autre

Cette catégorie permet de déclarer d'autres types d'activités (réunions, sorties pédagogiques, etc.). L'enseignant doit fournir :
- Une description détaillée de l'activité
- Un commentaire optionnel

## Workflow de validation

Le processus de validation des heures supplémentaires suit un workflow précis :

1. **Soumise** - L'enseignant crée et soumet une séance. À ce stade, il peut encore la modifier ou la supprimer pendant une durée limitée (configurable dans les paramètres système).

2. **Incomplète** - Le secrétariat ou la direction peut marquer une séance comme incomplète si des informations sont manquantes ou incorrectes. L'enseignant est alors invité à compléter ou corriger les informations.

3. **Vérifiée** - Le secrétariat vérifie les informations et marque la séance comme vérifiée. À ce stade, l'enseignant ne peut plus modifier la séance.

4. **Validée** - La direction valide la séance. À ce stade, le type de séance peut être modifié si nécessaire (par exemple, transformer un RCD en HSE).

5. **Prête pour paiement** - La séance est prête à être saisie dans le système de paie. Le secrétariat peut générer des exports pour faciliter cette saisie.

6. **Payée** - La séance a été mise en paiement. C'est le statut final d'une séance.

Une séance peut également être **Refusée** à n'importe quelle étape du processus. Dans ce cas, un motif de refus doit être fourni.

## Rôles des utilisateurs

L'application distingue plusieurs rôles d'utilisateurs, chacun avec des permissions spécifiques :

### Enseignant

Les enseignants peuvent :
- Créer de nouvelles séances
- Modifier ou supprimer leurs séances en statut "Soumise" ou "Incomplète"
- Consulter l'historique de leurs séances
- Indiquer leur participation au pacte
- Gérer leur signature électronique

### Secrétariat

Le secrétariat peut :
- Consulter toutes les séances
- Vérifier les séances soumises
- Marquer les séances comme "Incomplètes" ou "Vérifiées"
- Marquer les séances comme "Prêtes pour paiement" après validation par la direction
- Marquer les séances comme "Payées" une fois saisies dans le système de paie
- Générer des exports pour la saisie dans le système de paie

### Direction

La direction peut :
- Consulter toutes les séances
- Valider ou refuser les séances
- Modifier le type d'une séance lors de la validation
- Consulter des statistiques et rapports

### Administrateur

L'administrateur peut :
- Gérer les comptes utilisateurs
- Configurer les paramètres système
- Consulter les journaux d'activité

## Fonctionnalités principales

### Calendrier

Le calendrier permet de visualiser les séances sur une semaine. Il affiche :
- Les jours de la semaine (du lundi au vendredi)
- Les créneaux horaires (M1, M2, M3, M4, S1, S2, S3, S4)
- Les séances existantes, avec leur type et leur statut

Les enseignants peuvent cliquer sur un créneau pour créer une nouvelle séance.

### Liste des séances

La liste des séances permet de consulter l'ensemble des séances :
- Pour les enseignants : uniquement leurs propres séances
- Pour le secrétariat et la direction : toutes les séances

La liste peut être filtrée par :
- Date
- Type de séance
- Statut
- Enseignant (pour le secrétariat et la direction)

### Formulaires spécifiques

Chaque type de séance a un formulaire spécifique avec les champs appropriés :
- **RCD** : classe, enseignant remplacé
- **Devoirs Faits** : niveau, nombre d'élèves
- **HSE** : nature de l'activité
- **Autre** : description de l'activité

Tous les formulaires incluent également :
- Date
- Créneau horaire
- Commentaire optionnel

### Signature électronique

Les enseignants peuvent enregistrer leur signature électronique qui sera utilisée sur les documents officiels. La signature est capturée à l'aide d'un pad de signature électronique intégré à l'application.

### Exports

L'application permet d'exporter les données sous différents formats :
- **Export PDF** : pour les documents officiels (attestations, récapitulatifs, etc.)
- **Export Excel** : pour le traitement des données (tableaux récapitulatifs, statistiques, etc.)

## Pacte enseignant

L'application prend en compte le statut "pacte" des enseignants. Les heures effectuées dans le cadre du pacte sont comptabilisées séparément.

Les enseignants peuvent indiquer leur participation au pacte dans leur profil. Ce statut peut être modifié à tout moment, mais les séances déjà créées conservent le statut pacte qu'elles avaient au moment de leur création.

## Interface responsive

L'application est conçue pour être utilisable sur tous les appareils :
- **Ordinateur** : interface complète avec toutes les fonctionnalités
- **Tablette** : interface adaptée avec des contrôles optimisés pour l'écran tactile
- **Smartphone** : interface simplifiée pour une utilisation mobile

## Paramètres système

Les paramètres système permettent de configurer divers aspects de l'application :
- **Délai de modification** : durée pendant laquelle un enseignant peut modifier ou supprimer une séance après sa création (par défaut : 60 minutes)
- **Année scolaire** : définition de l'année scolaire en cours
- **Autres paramètres** : selon les besoins de l'établissement

## Sécurité

L'application implémente plusieurs mesures de sécurité :
- **Authentification** : chaque utilisateur doit s'authentifier avec son adresse email et son mot de passe
- **Autorisations** : les actions sont limitées en fonction du rôle de l'utilisateur
- **Journalisation** : toutes les actions importantes sont enregistrées dans un journal d'activité
- **Protection des données** : les données sensibles sont protégées conformément au RGPD

## Conclusion

L'application "Gestion des Heures Supplémentaires" offre une solution complète pour la gestion des heures supplémentaires dans un établissement scolaire. Elle simplifie le processus de déclaration, validation et mise en paiement, tout en offrant une traçabilité complète des actions effectuées.

Pour toute question ou suggestion, n'hésitez pas à contacter l'administrateur de l'application.
