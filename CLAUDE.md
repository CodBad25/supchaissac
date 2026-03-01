# CLAUDE.md - Instructions pour SupChaissac v2

## REGLE CRITIQUE : UTILISER L'ANCIEN CODE

**NE JAMAIS reinventer le code.** Toujours chercher d'abord dans l'ancien projet et adapter.

### Ancien code source (REFERENCE)
```
/Users/macbelhaj/Nextcloud/DEV/PROJETS EN COURS/HEURES SUPP/supchaissac-app-final/
```

### Nouveau projet (CIBLE)
```
/Users/macbelhaj/Dev/SupChaissac-v2/
```

---

## Composants existants dans l'ancien code

### Secretary (Secrétaire)
| Fichier | Description |
|---------|-------------|
| `client/src/components/secretary/SecretaryComponents.tsx` | Vue principale avec onglets (Dashboard, Validation, Historique) |
| `client/src/components/secretary/SessionReview.tsx` | Examen des sessions avec vérification documents |
| `client/src/components/secretary/AttachmentManager.tsx` | Gestion pièces jointes (voir, télécharger, vérifier, archiver) |
| `client/src/components/secretary/TeacherContracts.tsx` | Suivi contrats PACTE par enseignant |
| `client/src/components/secretary/PacteManagement.tsx` | Gestion des heures PACTE |

### Principal (Direction)
| Fichier | Description |
|---------|-------------|
| `client/src/components/principal/PrincipalComponents.tsx` | 5 onglets (Sessions, Actions, Historique, Contrats, Stats) |
| `client/src/components/principal/dashboard.tsx` | Dashboard avec stats et filtres |
| `client/src/components/principal/StatisticsCards.tsx` | Cartes statistiques |

### Admin
| Fichier | Description |
|---------|-------------|
| `client/src/components/admin/UserManagement.tsx` | Cartes enseignants avec PACTE toggle |
| `client/src/components/admin/CSVImport.tsx` | Import Pronote |
| `client/src/components/admin/PasswordReset.tsx` | Reset mot de passe |

### Teacher (Enseignant)
| Fichier | Description |
|---------|-------------|
| `client/src/components/teacher/TeacherComponents.tsx` | Dashboard enseignant |
| `client/src/components/teacher/AttachmentUpload.tsx` | Upload pièces jointes |
| `client/src/components/teacher/SessionWithAttachments.tsx` | Session avec fichiers |

---

## Workflow de validation (A RESPECTER)

```
TEACHER crée session (+ pièces jointes)
        ↓
    PENDING_REVIEW
        ↓
SECRETARY vérifie :
  - Documents joints présents ?
  - Documents vérifiés (checkboxes) ?
  - Vie scolaire OK ?
  - Peut demander infos supplémentaires
  - NE PEUT PAS REJETER
        ↓
    PENDING_VALIDATION
        ↓
PRINCIPAL valide OU rejette :
  - Peut valider
  - Peut rejeter (motif obligatoire)
  - Peut convertir AUTRE → RCD/DF/HSE
        ↓
    VALIDATED / REJECTED
        ↓
SECRETARY met en paiement
        ↓
      SENT_FOR_PAYMENT (= "Mis en paiement")
        ↓
   (FUTUR) PAID (= "Payé" effectif)
```

**Notes:**
- Le Principal peut AUSSI vérifier (comme la secrétaire) pour flexibilité.
- Le statut `SENT_FOR_PAYMENT` signifie "Mis en paiement" (transmis pour paiement).
- Un futur statut `PAID` sera ajouté pour confirmer le paiement effectif.

---

## Données Pronote (enseignants réels)

Format CSV d'import :
```
LOGIN,CIVILITE,NOM,PRENOM,EMAIL,DISCIPLINE,CLASSES,STATUT_PACTE
claire.bernard,Mme,BERNARD,Claire,claire.bernard@college.fr,MATHS,4B 3A,OUI
```

Fichier exemple : `supchaissac-app-final/exemple-import-pronote.csv`

---

## Stack technique

### Ancien code
- React + TypeScript
- shadcn/ui components
- TanStack Query (react-query)
- Express.js backend
- PostgreSQL avec Drizzle ORM

### Nouveau code (v2)
- React + TypeScript + Vite
- Tailwind CSS (design custom)
- Express.js backend
- PostgreSQL Neon avec Drizzle ORM
- S3 Scaleway pour fichiers

---

## Commandes

```bash
# Dev
npm run dev:full    # Frontend + Backend

# Database
npm run db:push     # Push schema
npm run db:seed     # Seed data
npm run db:migrate  # Drizzle migrations

# Build
npm run build

# Tests
npm run test:run    # Vitest
```

---

## Comptes de test

Les comptes de test suivent la convention `prenom.nom@example.com` et sont **visibles en production**. Connexion directe possible en cliquant sur un compte de démo.

| Rôle | Email | Mot de passe | Nom complet |
|------|-------|-------------|-------------|
| Teacher | sophie.martin@example.com | password123 | Sophie MARTIN |
| Teacher | marie.petit@example.com | password123 | Marie PETIT |
| Teacher | martin.dubois@example.com | password123 | Martin DUBOIS |
| Teacher | philippe.garcia@example.com | password123 | Philippe GARCIA |
| Secretary | laure.martin@example.com | password123 | Laure MARTIN |
| Principal | jean.dupont@example.com | password123 | Jean DUPONT |
| Admin | admin@example.com | password123 | Admin |

**Notes** :
- Tous les comptes @example.com sont des comptes de démo
- Connexion directe au clic sur un compte démo (UX simplifiée)
- Ces comptes ne sont jamais bloqués pour "non activé"

---

## Déploiement (Scaleway Serverless Containers)

Procédure de déploiement vers Scaleway :

```bash
# 1. Build image Docker (architecture amd64)
docker build --platform=linux/amd64 -t rg.fr-par.scw.cloud/funcscwsupchaissacvgfvl03o/supchaissac-app:latest .

# 2. Pousser l'image vers le registre Scaleway
docker push rg.fr-par.scw.cloud/funcscwsupchaissacvgfvl03o/supchaissac-app:latest

# 3. Déployer le container
scw container container deploy 581e9931-716f-42db-b6db-586ecb5b72c7
```

**Notes importantes** :
- L'image doit être en architecture `linux/amd64` (pas de ARM)
- Le registry est `rg.fr-par.scw.cloud` (région Paris)
- Vérifier que les variables d'environnement sont correctement configurées dans Scaleway Console
- Vérifier que S3 Scaleway est configuré avec les bonnes permissions pour les uploads de fichiers

---

## Dette technique (items d'audit reportés)

### 4.7 — Décomposition dashboards

**Situation** : Les 4 dashboards (Teacher, Secretary, Principal, Admin) font 500–900 lignes chacun.

**Actions futures** :
- Extraire des hooks réutilisables (`useSessions`, `useTeachers`, `useStats`)
- Créer des composants spécialisés pour les filtres, tableaux, cartes statistiques
- Objectif : < 500 lignes par fichier principal

**Priorité** : Basse. À faire quand les dashboards auront besoin de grosses nouvelles fonctionnalités ou si d'autres développeurs rejoignent le projet.

---

### 5.1 — Tests unitaires

**État actuel** : Vitest configuré + 6 tests sur le validateur de mot de passe.

**Actions futures** :
- Setup complet Vitest (test reporters, coverage)
- Tests sur validators (Zod schemas)
- Tests sur middleware d'authentification
- Tests sur transitions d'état des sessions (statuts, optimistic locking)
- Coverage cible : 70%+ serveur, 40%+ frontend

**Priorité** : Basse. À faire quand l'app sera utilisée en production réelle OU si d'autres développeurs rejoignent le projet.

---

## Préférences UI

- **JAMAIS de window.confirm / window.alert** : Utiliser des modales personnalisées à la place des popups natives du navigateur
- **JAMAIS de checkbox** : Utiliser des boutons cliquables ou des toggles pour les options on/off
- **JAMAIS de select (menu déroulant)** : Utiliser des boutons ou chips cliquables pour les choix multiples

---

## Optimisations de performance

### Images
- **Logo** : Doit rester < 300 Ko. Le logo original (2048x2048, 5 Mo) a été compressé en 512x512 (291 Ko). Une copie de l'original est dans `public/logo-original.png`.
- **Règle** : Toute image dans `public/` doit être optimisée avant commit (max 500 Ko pour les images, 100 Ko pour les icônes).

### Bundle JS
- Bundle actuel : ~750 Ko (acceptable)
- Si le bundle dépasse 1.5 Mo, envisager du code-splitting avec `React.lazy()`

### Diagnostic lenteur
Pour diagnostiquer une lenteur de chargement :
1. Ouvrir DevTools (F12) → onglet Network
2. Recharger la page
3. Vérifier la colonne "Taille" et "Durée"
4. Les gros fichiers (> 500 Ko) ou requêtes lentes (> 500 ms) sont les coupables

---

## État de l'audit de sécurité

**L'audit complet est terminé.**

Résumé :
- **58/60 problèmes corrigés** (96,7% de couverture)
- **2 items reportés** à titre de dette technique (décomposition dashboards, tests unitaires)
- **5 phases couverts** : sécurité, BDD, backend, frontend, DevOps
- **6 corrections post-audit** : renommage statuts, dates, toast, emails démo

Voir le rapport complet : `docs/AUDIT-REPORT.md`

---

## CHECKLIST avant de coder

1. [ ] Chercher le composant dans l'ancien code
2. [ ] Lire et comprendre l'implémentation existante
3. [ ] Adapter au nouveau design (Tailwind)
4. [ ] Conserver la logique métier
5. [ ] Tester avec les mêmes scénarios
