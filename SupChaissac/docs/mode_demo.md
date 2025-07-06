# Mode Démo et Sélecteur de Rôle

Ce document explique le fonctionnement du mode démo et du sélecteur de rôle, une fonctionnalité spécifique à cette application qui facilite les tests et les démonstrations.

## Objectif du Mode Démo

Le mode démo permet de tester facilement toutes les interfaces utilisateur sans avoir à se déconnecter et se reconnecter avec différents comptes. Cette fonctionnalité est particulièrement utile pour:

- Présenter l'application à de nouveaux utilisateurs
- Former les différents types d'utilisateurs
- Tester rapidement les différentes interfaces
- Vérifier la cohérence entre les différentes vues

## Implémentation du Sélecteur de Rôle

### Route Dédiée
- Une page spéciale `/role-select` permet de choisir le rôle à simuler
- Cette page est accessible depuis n'importe quelle vue via un bouton "Changer de rôle"

### Fonctionnement Technique
- Le rôle sélectionné est stocké dans l'URL comme paramètre (ex: `/?role=principal`)
- L'application charge l'interface correspondante en fonction de ce paramètre
- Aucune modification des droits réels n'est effectuée, seule l'interface change

### Interface du Sélecteur
- Présentation claire des quatre rôles disponibles
- Description brève de chaque rôle
- Boutons visuellement distincts pour chaque option
- Animation de transition lors du changement

## Structure du Mode Démo

### Layout Principal
Dans le fichier `App.tsx` et `main-layout.tsx`, l'application utilise des conditions pour afficher l'interface correspondant au rôle sélectionné:

```jsx
{role === "teacher" && <TeacherView />}
{role === "secretary" && <SecretaryView />}
{role === "principal" && <PrincipalView />}
{role === "admin" && <AdminView />}
```

### Navigation Entre Rôles
Un bouton persistant "Changer de rôle" est affiché dans le coin supérieur droit de l'interface, permettant de revenir à tout moment au sélecteur de rôle.

## Rôles Disponibles

### Enseignant (Teacher)
- Vue par défaut si aucun rôle n'est spécifié
- Accès aux fonctionnalités de déclaration et suivi des sessions
- Deux variantes: avec pacte et sans pacte

### Secrétariat (Secretary)
- Interface de vérification des sessions
- Suivi des paiements
- Vue globale des heures effectuées

### Direction (Principal)
- Interface de validation finale
- Statistiques et rapports
- Suivi des contrats

### Administration (Admin)
- Gestion des utilisateurs
- Import PRONOTE
- Configuration système
- Interface séparée des autres rôles

## Distinction Importante

Il faut noter que le mode démo change uniquement l'interface affichée mais ne modifie pas les permissions réelles de l'utilisateur. Pour les opérations sensibles qui nécessitent des droits spécifiques (comme la validation de sessions), des contrôles d'autorisation sont effectués côté serveur.

Le mode démo est donc principalement un outil de visualisation et non un moyen de contourner les restrictions de sécurité.

## Utilisation en Production

En environnement de production, le sélecteur de rôle peut être:
- Désactivé complètement
- Réservé aux administrateurs
- Maintenu pour tous les utilisateurs (option actuelle)

La décision dépendra des besoins spécifiques de l'établissement et des politiques de sécurité en place.