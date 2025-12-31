# 📋 DOCUMENTATION COMPLÈTE - SUPCHAISSAC V2.0 RECONSTRUCTION

## 🎯 **CONTEXTE ET OBJECTIFS**

### **PROBLÈME INITIAL :**
- Ancien projet avec architecture hybride (PostgreSQL + SQLite)
- Schémas incohérents entre bases de données
- Erreurs d'affichage ("Classe undefined")
- Interface non professionnelle
- Rôles mal définis

### **OBJECTIF RECONSTRUCTION :**
- Architecture PostgreSQL uniquement (Neon.tech)
- Schéma unifié et cohérent
- Interface professionnelle et responsive
- Rôles strictement séparés
- Fonctionnalités UX préservées

---

## 🏗️ **ARCHITECTURE TECHNIQUE VALIDÉE**

### **STACK TECHNIQUE :**
```json
{
  "frontend": {
    "react": "^18.3.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.14",
    "tailwindcss": "^3.4.14",
    "wouter": "^3.3.5",
    "@tanstack/react-query": "^5.60.5",
    "react-hook-form": "^7.53.1",
    "zod": "^3.23.8",
    "date-fns": "^3.6.0",
    "framer-motion": "^11.13.1",
    "lucide-react": "^0.453.0"
  },
  "backend": {
    "express": "^4.21.2",
    "typescript": "^5.6.3",
    "drizzle-orm": "^0.39.3",
    "postgres": "^3.4.7",
    "passport": "^0.7.0",
    "bcrypt": "^6.0.0",
    "express-session": "^1.18.1",
    "multer": "^2.0.2"
  },
  "database": {
    "provider": "PostgreSQL Neon (cloud)",
    "orm": "Drizzle ORM",
    "migrations": "Automatiques"
  }
}
```

### **STRUCTURE PROJET :**
```
SupChaissac-VF-2025-09-13/
├── src/                    # Frontend React
│   ├── components/         # Composants UI
│   ├── pages/             # Pages de l'application
│   ├── hooks/             # Hooks personnalisés
│   ├── lib/               # Utilitaires
│   └── scripts/           # Scripts de seed data
├── server/                # Backend Express
│   ├── routes/            # Routes API
│   ├── middleware/        # Middleware auth
│   └── services/          # Services métier
├── shared/                # Types partagés
└── docs/                  # Documentation
```

---

## 🔄 **WORKFLOW MÉTIER FINAL**

### **STATUTS SESSIONS :**
```
CRÉATION → PENDING_REVIEW → PENDING_VALIDATION → VALIDATED → PAID
(Enseignant)   (Secrétaire)     (Principal)      (Principal) (Secrétaire)
     ↓             ↓                ↓
  REJECTED    REJECTED        REJECTED
```

### **RÔLES ET PERMISSIONS :**

#### **🎓 ENSEIGNANT :**
- ✅ Déclarer SES heures uniquement
- ✅ Voir SES sessions uniquement
- ✅ Statut PACTE = LECTURE SEULE
- ✅ Modifier si PENDING_REVIEW + dans délai
- ❌ Pas de coûts/budget
- ❌ Pas de validation d'autres sessions

#### **📝 SECRÉTAIRE :**
- ✅ Première validation (PENDING_REVIEW → PENDING_VALIDATION)
- ✅ Gestion PACTE enseignants (modification)
- ✅ Vue toutes sessions
- ✅ Mettre en paiement (PAID)
- ❌ Pas de validation finale

#### **🏛️ PRINCIPAL :**
- ✅ Validation finale (PENDING_VALIDATION → VALIDATED)
- ✅ Dashboard minimal (4 métriques)
- ✅ Statistiques progressives (à la demande)
- ❌ Pas de coûts/budget
- ❌ Pas de gestion PACTE

#### **⚙️ ADMIN :**
- ✅ TECHNIQUE UNIQUEMENT : gestion utilisateurs, import, config
- ❌ ZÉRO donnée opérationnelle
- ❌ ZÉRO workflow métier

---

## 🎨 **FONCTIONNALITÉS UX À PRÉSERVER**

### **📅 CALENDRIER WEEKEND INTELLIGENT :**
```typescript
// Vue pont weekend - SAMEDI
Jeudi | Vendredi | Samedi | Dimanche | Lundi
  -2  |    -1    |   0    |    +1    |  +2

// Vue pont weekend - DIMANCHE  
Vendredi | Samedi | Dimanche | Lundi | Mardi
   -2    |   -1   |    0     |  +1   |  +2
```

### **🎭 MODALES EN CASCADE :**
1. **Sélection type** (RCD/Devoirs/Autre)
2. **Formulaire spécialisé** par type
3. **Confirmation récapitulatif**
4. **Validation** avec formatage auto

### **🎨 COULEURS PAR NIVEAU :**
- **6ème** : `bg-emerald-100 text-emerald-800` (vert émeraude)
- **5ème** : `bg-blue-100 text-blue-800` (bleu)
- **4ème** : `bg-purple-100 text-purple-800` (violet)
- **3ème** : `bg-red-100 text-red-800` (rouge)

### **👤 FORMATAGE AUTOMATIQUE :**
```typescript
// Noms automatiques
values.replacedTeacherLastName = values.replacedTeacherLastName.toUpperCase();
values.replacedTeacherFirstName = values.replacedTeacherFirstName.charAt(0).toUpperCase() + 
                                  values.replacedTeacherFirstName.slice(1).toLowerCase();

// Accord de genre
{rcdForm.replacedTeacherPrefix === 'Mme' ? 'Enseignante remplacée' : 'Enseignant remplacé'}
```

---

## 📊 **SCHÉMA BASE DE DONNÉES UNIFIÉ**

### **TABLES PRINCIPALES :**
```sql
-- Utilisateurs
users (
  id, email, password_hash, first_name, last_name, 
  role, pacte_status, created_at, updated_at
)

-- Sessions
sessions (
  id, user_id, date, time_slot, session_type, status,
  className, studentCount, gradeLevel, description,
  replaced_teacher_first_name, replaced_teacher_last_name,
  created_at, updated_at
)

-- Pièces jointes
attachments (
  id, session_id, filename, original_name, 
  file_path, file_size, mime_type, created_at
)

-- Paramètres système
system_settings (
  id, key, value, description, created_at, updated_at
)
```

### **ENUMS :**
```typescript
enum UserRole {
  TEACHER = 'TEACHER',
  SECRETARY = 'SECRETARY', 
  PRINCIPAL = 'PRINCIPAL',
  ADMIN = 'ADMIN'
}

enum SessionStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  PENDING_VALIDATION = 'PENDING_VALIDATION',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
  PAID = 'PAID'
}

enum SessionType {
  RCD = 'RCD',
  DEVOIRS_FAITS = 'DEVOIRS_FAITS',
  AUTRE = 'AUTRE'
}
```

---

## 🚀 **PLAN DE DÉVELOPPEMENT DÉTAILLÉ**

### **PHASE 1 : FONDATIONS** ✅ **TERMINÉE**
- [x] Setup Vite + React 18 + TypeScript
- [x] PostgreSQL Neon (cloud)
- [x] Drizzle ORM + schéma unifié
- [x] Seed data automatique (comptes test)
- [x] Auth Passport.js + protection routes
- [x] Design system TailwindCSS

### **PHASE 2 : INTERFACE ENSEIGNANT** 🎯 **EN COURS**
**Priorité absolue - Interface principale**

#### **2.1 Page de Connexion :**
- [ ] Logo SupChaissac avec bouclier
- [ ] Formulaire email/mot de passe
- [ ] Bouton "Se connecter"
- [ ] Section comptes de test (Sophie Martin, Marie Petit, etc.)
- [ ] Redirection après authentification

#### **2.2 Dashboard Personnel :**
- [ ] Statut PACTE (lecture seule)
- [ ] Progression heures (simple)
- [ ] Sessions récentes

#### **2.3 Calendrier Intelligent :**
- [ ] Vue hebdomadaire Lundi-Vendredi
- [ ] Vue pont weekend (2 jours avant/après)
- [ ] Créneaux M1-M4, S1-S4
- [ ] Responsive mobile natif

#### **2.4 Système Modales :**
- [ ] Modale sélection type (RCD/Devoirs/Autre)
- [ ] Formulaires spécialisés par type
- [ ] Confirmation récapitulatif
- [ ] Validation Zod + formatage auto

#### **2.5 Mes Sessions :**
- [ ] Liste sessions personnelles uniquement
- [ ] Filtres par statut/date
- [ ] Modification si PENDING_REVIEW + délai
- [ ] Upload pièces jointes

### **PHASE 3 : INTERFACE SECRÉTAIRE**
**Workflow validation étape 1**

#### **3.1 Dashboard :**
- [ ] 4 cartes statistiques colorées
- [ ] Sessions récentes
- [ ] Alertes

#### **3.2 Validation :**
- [ ] Liste toutes sessions
- [ ] Actions : PENDING_REVIEW → PENDING_VALIDATION
- [ ] Rejet avec motif
- [ ] Filtres avancés

#### **3.3 Gestion PACTE :**
- [ ] Liste enseignants
- [ ] Modification statuts PACTE
- [ ] Statistiques PACTE

### **PHASE 4 : INTERFACE PRINCIPAL**
**Validation finale + supervision**

#### **4.1 Dashboard Minimal :**
- [ ] Sessions en attente validation (nombre)
- [ ] Sessions validées ce mois (nombre)
- [ ] Sessions rejetées ce mois (nombre)
- [ ] Enseignants actifs (nombre)

#### **4.2 Validation Finale :**
- [ ] PENDING_VALIDATION → VALIDATED
- [ ] Commentaires validation
- [ ] Rejet avec motif

#### **4.3 Statistiques Progressives :**
- [ ] Répartition par type (si demandé)
- [ ] Évolution mensuelle (si besoin)
- [ ] Par enseignant (si nécessaire)

### **PHASE 5 : INTERFACE ADMIN**
**Technique pur - ZÉRO métier**

#### **5.1 Gestion Utilisateurs :**
- [ ] CRUD comptes
- [ ] Attribution rôles
- [ ] Réinitialisation mots de passe

#### **5.2 Import PRONOTE :**
- [ ] Upload CSV
- [ ] Mapping données
- [ ] Validation import

#### **5.3 Configuration :**
- [ ] Paramètres système
- [ ] Variables environnement

### **PHASE 6 : OPTIMISATION**
**Production ready**

#### **6.1 Performance :**
- [ ] Lazy loading
- [ ] Pagination
- [ ] Optimisation images

#### **6.2 Responsive Final :**
- [ ] Mobile-first
- [ ] Tablette
- [ ] Desktop

#### **6.3 Accessibilité :**
- [ ] ARIA labels
- [ ] Navigation clavier
- [ ] Contraste couleurs

#### **6.4 Tests Sécurité :**
- [ ] Validation côté serveur
- [ ] Protection CSRF
- [ ] Rate limiting
- [ ] Logs anonymisés

---

## 🔐 **COMPTES DE TEST CRÉÉS**

### **ENSEIGNANTS :**
- **Sophie MARTIN** (teacher1@example.com) - Sans PACTE
- **Marie PETIT** (teacher2@example.com) - Avec PACTE
- **Martin DUBOIS** (teacher3@example.com) - Sans PACTE
- **Philippe GARCIA** (teacher4@example.com) - Avec PACTE

### **ADMINISTRATION :**
- **Laure MARTIN** (secretary@example.com) - Secrétariat
- **Jean DUPONT** (principal@example.com) - Direction
- **Admin SYSTEM** (admin@example.com) - Technique

**Mot de passe pour tous :** `password123`

---

## 📝 **DÉCISIONS VALIDÉES**

### **ARCHITECTURE :**
- ✅ PostgreSQL Neon uniquement (pas de SQLite)
- ✅ Drizzle ORM pour la cohérence
- ✅ Seed data automatique
- ✅ Pas de Docker (simplicité)

### **FONCTIONNALITÉS :**
- ✅ Calendrier weekend intelligent (fonctionnalité signature)
- ✅ Modales en cascade
- ✅ Couleurs par niveau
- ✅ Formatage automatique des noms
- ✅ Accord de genre intelligent
- ❌ Pas de coûts/budget (exclu)

### **RÔLES :**
- ✅ Admin = technique uniquement
- ✅ Principal = validation finale + dashboard simple
- ✅ Enseignant = PACTE lecture seule
- ✅ Approche progressive pour fonctionnalités

### **DÉVELOPPEMENT :**
- ✅ Méthode Melvyn (itératif, documenté, testé)
- ✅ Phase par phase avec validation
- ✅ Pas de régression sur les décisions

---

## 🎯 **PROCHAINES ÉTAPES IMMÉDIATES**

### **ÉTAPE 1 : INTERFACE DE CONNEXION**
1. Créer la page de connexion identique à la capture
2. Intégrer l'authentification Passport.js
3. Tester avec les comptes de test
4. Redirection vers dashboard enseignant

### **ÉTAPE 2 : DASHBOARD ENSEIGNANT**
1. Interface personnelle
2. Statut PACTE (lecture seule)
3. Sessions récentes
4. Navigation vers calendrier

### **ÉTAPE 3 : CALENDRIER INTELLIGENT**
1. Vue semaine normale
2. Vue pont weekend (fonctionnalité signature)
3. Créneaux M1-M4, S1-S4
4. Responsive mobile

---

## 📞 **CONTACTS ET RESSOURCES**

### **BASE DE DONNÉES :**
- **Provider :** Neon.tech
- **URL :** postgresql://neondb_owner:npg_CFbU1zhk7gim@ep-super-frost-agoz920t-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

### **PORTS :**
- **Frontend :** http://localhost:5173
- **Backend :** http://localhost:3001
- **API :** http://localhost:3001/api

### **COMMANDES UTILES :**
```bash
# Développement
npm run dev          # Frontend + Backend
npm run dev:server   # Backend uniquement

# Base de données
npm run db:generate  # Générer migrations
npm run db:push      # Pousser vers Neon
npm run db:seed      # Données de test
npm run db:reset     # Reset complet

# Production
npm run build        # Build complet
npm run start        # Démarrer production
```

---

## ✅ **VALIDATION PHASE 1**

### **FONCTIONNEL :**
- ✅ Frontend React + Vite sur port 5173
- ✅ Backend Express + Auth sur port 3001
- ✅ PostgreSQL Neon connecté
- ✅ Comptes de test créés
- ✅ Authentification Passport.js
- ✅ TailwindCSS configuré
- ✅ Schéma unifié Drizzle ORM

### **PRÊT POUR PHASE 2 :**
- ✅ Architecture solide
- ✅ Base de données opérationnelle
- ✅ Authentification fonctionnelle
- ✅ Environnement de développement stable

---

**🎯 OBJECTIF : Interface de connexion professionnelle identique à la capture fournie**

**📅 DÉLAI ESTIMÉ : 2-3 heures pour l'interface de connexion complète**

**🚀 STATUT : Prêt pour Phase 2 - Interface Enseignant**
