# 🏗️ Architecture Technique - SupChaissac

## 📋 Vue d'ensemble

SupChaissac est une application web full-stack pour la gestion des heures supplémentaires des enseignants, construite avec une architecture moderne et modulaire.

## 🎯 Stack Technologique

### **Frontend**
- **React 18** avec TypeScript
- **Vite** pour le build et le développement
- **TailwindCSS** pour le styling
- **Lucide React** pour les icônes
- **React Hook Form** pour la gestion des formulaires
- **Zod** pour la validation côté client

### **Backend**
- **Node.js** avec Express.js
- **TypeScript** pour la sécurité des types
- **Passport.js** pour l'authentification
- **Express Session** pour la gestion des sessions

### **Base de données**
- **Drizzle ORM** pour l'abstraction de base de données
- **PostgreSQL** pour la production
- **SQLite** pour le développement
- **Système hybride** avec fallback automatique

### **Infrastructure**
- **Docker** pour PostgreSQL en développement
- **Système de factory** pour la sélection de base de données
- **Variables d'environnement** pour la configuration

## 🏛️ Architecture Générale

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   FRONTEND      │◄──►│    BACKEND      │◄──►│   DATABASE      │
│   (React/Vite)  │    │  (Express/Node) │    │ (PostgreSQL/    │
│                 │    │                 │    │  SQLite)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐             ┌────▼────┐             ┌────▼────┐
    │ Client  │             │   API   │             │ Storage │
    │Components│             │ Routes  │             │ Layer   │
    └─────────┘             └─────────┘             └─────────┘
```

## 📁 Structure des Dossiers

```
SupChaissac/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── hooks/         # Hooks personnalisés
│   │   ├── lib/           # Utilitaires
│   │   └── pages/         # Pages principales
│   └── public/            # Assets statiques
├── server/                # Backend Express
│   ├── auth.ts           # Authentification
│   ├── routes.ts         # Routes API
│   ├── storage.ts        # Interface de stockage
│   ├── pg-storage.ts     # Implémentation PostgreSQL
│   ├── sqlite-storage.ts # Implémentation SQLite
│   └── storage-factory.ts # Factory pattern
├── shared/               # Code partagé
│   ├── schema.ts         # Schémas PostgreSQL
│   └── schema-sqlite.ts  # Schémas SQLite
├── scripts/              # Scripts utilitaires
├── docs/                 # Documentation
└── data/                 # Base de données SQLite
```

## 🗄️ Architecture Base de Données

### **Modèle de Données**

#### **Users (Utilisateurs)**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  role ENUM('TEACHER', 'SECRETARY', 'PRINCIPAL', 'ADMIN'),
  initials VARCHAR(10),
  signature TEXT,
  in_pacte BOOLEAN DEFAULT FALSE
);
```

#### **Sessions (Heures supplémentaires)**
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time_slot ENUM('M1', 'M2', 'M3', 'M4', 'S1', 'S2', 'S3', 'S4'),
  type ENUM('RCD', 'DEVOIRS_FAITS', 'HSE', 'AUTRE'),
  teacher_id INTEGER REFERENCES users(id),
  teacher_name VARCHAR NOT NULL,
  in_pacte BOOLEAN DEFAULT FALSE,
  status ENUM('PENDING_REVIEW', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'PAID'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  updated_by VARCHAR,
  -- Détails de la session
  classes TEXT,
  subject VARCHAR,
  description TEXT,
  -- Workflow de validation
  reviewed_by VARCHAR,
  reviewed_at TIMESTAMP,
  review_comments TEXT,
  validated_by VARCHAR,
  validated_at TIMESTAMP,
  validation_comments TEXT,
  rejected_by VARCHAR,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  paid_by VARCHAR,
  paid_at TIMESTAMP,
  payment_reference VARCHAR
);
```

#### **Teacher Setups (Configuration enseignants)**
```sql
CREATE TABLE teacher_setups (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER UNIQUE REFERENCES users(id),
  preferred_subjects TEXT, -- JSON array
  available_time_slots TEXT, -- JSON array
  max_hours_per_week INTEGER DEFAULT 10,
  notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

#### **System Settings (Paramètres système)**
```sql
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_by VARCHAR NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Relations**
- `sessions.teacher_id` → `users.id`
- `teacher_setups.teacher_id` → `users.id`

## 🔄 Flux de Données

### **1. Authentification**
```
Client → POST /api/login → Passport.js → Database → Session Store → Client
```

### **2. Création de session**
```
Client → POST /api/sessions → Validation → Database → Response → Client
```

### **3. Workflow de validation**
```
PENDING_REVIEW → PENDING_VALIDATION → VALIDATED → PAID
       ↓                ↓               ↓        ↓
   Secretary        Principal       Admin    Admin
```

## 🔧 Couche d'Abstraction

### **Interface IStorage**
```typescript
interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Sessions
  getSessions(): Promise<Session[]>;
  getSessionsByTeacher(teacherId: number): Promise<Session[]>;
  createSession(sessionData: InsertSession): Promise<Session>;
  updateSession(id: number, data: Partial<Session>): Promise<Session | undefined>;
  deleteSession(id: number): Promise<boolean>;
  
  // Teacher Setups
  getTeacherSetup(teacherId: number): Promise<TeacherSetup | undefined>;
  createTeacherSetup(setupData: InsertTeacherSetup): Promise<TeacherSetup>;
  updateTeacherSetup(teacherId: number, data: Partial<TeacherSetup>): Promise<TeacherSetup | undefined>;
  
  // System Settings
  getSystemSettings(): Promise<SystemSetting[]>;
  getSystemSettingByKey(key: string): Promise<SystemSetting | undefined>;
  createSystemSetting(settingData: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(key: string, value: string, updatedBy: string): Promise<SystemSetting | undefined>;
  
  // Session Store
  sessionStore: any;
}
```

### **Factory Pattern**
```typescript
export async function createStorage(): Promise<IStorage> {
  const databaseUrl = process.env.DATABASE_URL;
  
  // PostgreSQL si URL disponible
  if (databaseUrl?.startsWith('postgresql://')) {
    return new PgStorage(databaseUrl);
  }
  
  // SQLite pour le développement
  if (nodeEnv === 'development') {
    return new SqliteStorage('./data/supchaissac.db');
  }
  
  // Fallback MemStorage
  return new MemStorage();
}
```

## 🔐 Sécurité

### **Authentification**
- **Passport.js** avec stratégie locale
- **Sessions sécurisées** avec express-session
- **Hachage des mots de passe** (à implémenter en production)

### **Autorisation**
- **Rôles utilisateur** : TEACHER, SECRETARY, PRINCIPAL, ADMIN
- **Contrôle d'accès** basé sur les rôles
- **Validation des données** avec Zod

### **Configuration**
- **Variables d'environnement** pour les secrets
- **Séparation dev/prod** avec configurations distinctes

## 📊 Performance

### **Optimisations actuelles**
- **Drizzle ORM** pour des requêtes optimisées
- **SQLite WAL mode** pour de meilleures performances
- **Session store** en mémoire pour le développement

### **Optimisations futures**
- **Pagination** pour les grandes listes
- **Cache Redis** pour les sessions fréquentes
- **Index de base de données** pour les requêtes courantes
- **Compression** des réponses HTTP

## 🚀 Déploiement

### **Développement**
- **SQLite** pour la simplicité
- **Hot reload** avec Vite
- **Docker** optionnel pour PostgreSQL

### **Production**
- **PostgreSQL** pour la robustesse
- **Variables d'environnement** sécurisées
- **Logging** structuré
- **Monitoring** des erreurs

## 🔄 Évolutivité

### **Architecture modulaire**
- **Interface IStorage** permet de changer de base de données
- **Factory pattern** pour la sélection automatique
- **Composants React** réutilisables
- **API REST** bien structurée

### **Extensions possibles**
- **Notifications** par email/SMS
- **Export PDF** des rapports
- **API mobile** pour une app native
- **Intégration** avec systèmes existants
