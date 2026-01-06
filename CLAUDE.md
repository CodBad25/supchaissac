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
      PAID (= "Mis en paiement", PAS "Payé")
        ↓
   (FUTUR) PAYMENT_COMPLETED (= "Payé" effectif)
```

**Notes:**
- Le Principal peut AUSSI vérifier (comme la secrétaire) pour flexibilité.
- Le statut `PAID` signifie "Mis en paiement" (transmis pour paiement), pas "Payé".
- Un futur statut `PAYMENT_COMPLETED` sera ajouté pour confirmer le paiement effectif.

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

# Build
npm run build
```

---

## Comptes de test

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher1@example.com | password123 |
| Secretary | secretary@example.com | password123 |
| Principal | principal@example.com | password123 |
| Admin | admin@example.com | password123 |

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

## CHECKLIST avant de coder

1. [ ] Chercher le composant dans l'ancien code
2. [ ] Lire et comprendre l'implémentation existante
3. [ ] Adapter au nouveau design (Tailwind)
4. [ ] Conserver la logique métier
5. [ ] Tester avec les mêmes scénarios
