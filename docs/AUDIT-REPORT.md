# Rapport d'Audit — SupChaissac v2

**Date** : 28 février 2026
**Branche** : `audit/corrections`
**Statut** : 4 commits audit + modifications post-audit en cours, non poussé sur le remote

---

## Résumé

Audit complet de l'application SupChaissac v2 (gestion des heures supplémentaires, Collège Gaston Chaissac). **60 problèmes identifiés** (19 critiques, 27 importants, 14 mineurs), organisés en 5 phases.

---

## COMMITS DE L'AUDIT (4 commits)

### Commit 1 — `4bcab61` — Phase 1 : Sécurité critique
- Blocage des comptes non activés au login (sauf comptes de test)
- Correction IDOR sur les uploads (vérification propriétaire de session)
- Protection `/api/auth/users-list` en production
- Validation Zod sur `PATCH /admin/users/:id` (whitelist stricte de champs)
- Guard production sur `resetDatabase()`
- CORS durci avec whitelist explicite `ALLOWED_ORIGINS`
- Validation complexité mot de passe (8 chars, majuscule, minuscule, chiffre)
- Secret de session aléatoire en dev (plus de fallback statique)
- Suppression fuite d'info dans les réponses 403
- Protection XSS dans le template email (`escapeHtml()`)
- Rate limiting : login (5/15min), activation (10/15min)
- Type `Express.User` complété (firstName, lastName, civilite, subject, isActivated)

### Commit 2 — `6bcf70b` — Phases 2-3 : BDD + Backend
**Base de données :**
- FK cascade : `sessions.teacherId` → `users.id`, `attachments.sessionId` → `sessions.id`
- Index : sessions(teacherId, date, status), attachments(sessionId), students(schoolYear, className)
- Contrainte UNIQUE sur (teacherId, date, timeSlot)
- Transactions pour suppressions (session + attachments, user + cascade)
- Optimistic locking sur transitions de statut (409 Conflict si race condition)
- Connection pooling Neon : max 5, idle_timeout 20, connect_timeout 30s
- Export `closeDb()` pour shutdown propre
- Guard production sur `seed-demo.ts`
- Script `db:migrate` dans package.json

**Backend :**
- Dockerfile non-root (user nodejs:1001)
- Health check avec vraie requête BDD (`SELECT 1`, 503 si KO)
- Graceful shutdown (SIGTERM/SIGINT → server.close + closeDb + timeout 10s)
- Compression gzip
- Rate limiting global API (300/15min)
- Timezone `Europe/Paris`
- Suppression fallback fausses données dans TeacherDashboard (redirect /login)
- Sanitisation noms fichiers (accents NFD + strip diacritiques)
- Bcrypt standardisé à 12 rounds
- Script `start:prod` dans package.json

### Commit 3 — `3c49054` — Phases 4-5 : Frontend + DevOps
**Frontend :**
- `AuthContext` global avec hook `useAuth()` (user, isLoading, login, logout, refreshUser)
- `apiFetch<T>()` centralisé avec gestion 401 → redirect login
- `ProtectedRoute` avec vérification auth + rôle
- `ErrorBoundary` React
- Types partagés : `UserData`, `SessionData`, `AttachmentData`, `TeacherData`

**DevOps :**
- Vitest configuré + 6 tests sur le validateur de mot de passe
- GitHub Actions CI (build + test sur push/PR)
- `.dockerignore` complété
- `docker-compose.yml` pour PostgreSQL local
- `.env.example` documenté

### Commit 4 — `a7bb597` — Correctifs testés en session
- **Dates de vacances** : corrigé dans `server/services/holidays.ts` ET `src/lib/holidays.ts` — les dates `end` étaient au lundi (jour de reprise) au lieu du dimanche (dernier jour de vacances). Corrigé pour TOUTES les périodes 2024-2025 et 2025-2026.
- **Recherche élèves** : remplacé chargement complet + filtre JS par requête SQL ILIKE + LIMIT
- **Recherche enseignants** : idem, SQL ILIKE au lieu de filtre JS
- **UX recherche** : champ de recherche vidé après sélection d'un élève
- **Connect timeout** : augmenté de 10s à 30s pour cold start Neon

---

## MODIFICATIONS POST-AUDIT (non encore commitées)

### Filtre secrétaire corrigé
- **Fichier** : `src/pages/SecretaryDashboard.tsx`
- Le filtre "À examiner" incluait `PENDING_VALIDATION` (sessions déjà transmises au principal). Corrigé : `PENDING_VALIDATION` déplacé dans l'onglet "Historique".
- Compteur `stats.history` ajouté (PAID + REJECTED + PENDING_VALIDATION)
- Badge `PENDING_VALIDATION` renommé "Transmise au principal" (au lieu de "À valider")
- Badges sessions récentes remplacés par `getStatusBadge()` (couvre tous les statuts)
- Accents corrigés partout : "À examiner", "Validée", "Rejetée"

### Badge PACTE dans modale principal
- **Fichier** : `server/routes/sessions.ts` — ajout `teacherInPacte: users.inPacte` dans la jointure de l'API sessions admin
- **Fichier** : `src/pages/PrincipalDashboard.tsx` — ajout `teacherInPacte` à l'interface Session, badge PACTE/Sans PACTE affiché dans le header de la modale de validation (à côté du nom de l'enseignant)
- Header de la modale compacté : nom + badge PACTE + badge type sur une seule ligne, date en dessous
- Section description et pièces jointes compactée (moins de padding)
- **IMPORTANT** : les boutons de validation/rejet (workflow avec emojis, avec/sans commentaire) ont été restaurés à l'identique

### Date de mise en paiement
- **Schéma** : `src/lib/schema.ts` — nouveau champ `paidAt: timestamp("paid_at")` sur la table sessions
- **Migration SQL** : `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;` (exécuté manuellement)
- **Backend** : `server/routes/sessions.ts` — `paidAt: new Date()` ajouté dans `PUT /:id/mark-paid`
- **Backend** : `paidAt` ajouté dans le SELECT de la route sessions admin
- **Frontend enseignant** : `src/pages/TeacherDashboard.tsx` — date affichée sous le badge "Mis en paiement" dans les sessions récentes (format : "le 28 fév. 2026")
- **Calendrier** : `src/components/SmartCalendar.tsx` — idem dans le résumé des sessions
- **Note** : les sessions déjà en statut PAID n'ont pas de `paidAt` (champ null), la date n'apparaît que pour les nouvelles mises en paiement

---

## PROCHAINE ÉTAPE — Renommage statut PAID → SENT_FOR_PAYMENT

**Décision validée par l'utilisateur** : le statut `PAID` est une mauvaise traduction ("paid" = "payé" en anglais, mais dans l'app ça signifie "mis en paiement"). Comme les données actuelles sont des données de test obsolètes (sauf Mohamed Belhaj), c'est le bon moment pour corriger.

### Plan :
1. Renommer l'enum dans le schéma : `PAID` → `SENT_FOR_PAYMENT`
2. Mettre à jour toutes les références dans le code (serveur + frontend) :
   - `server/routes/sessions.ts` — transitions de statut, mark-paid, validate
   - `server/routes/admin.ts` — stats
   - `server/routes/pacte.ts` — stats
   - `src/pages/SecretaryDashboard.tsx` — filtres, badges, stats
   - `src/pages/PrincipalDashboard.tsx` — filtres, badges, actions
   - `src/pages/TeacherDashboard.tsx` — stats, affichage
   - `src/pages/AdminDashboard.tsx` — stats
   - `src/components/SmartCalendar.tsx` — badges
   - `src/styles/theme.ts` — couleurs et labels
3. Migration SQL : `UPDATE sessions SET status = 'SENT_FOR_PAYMENT' WHERE status = 'PAID';`
4. Modifier l'enum PostgreSQL pour ajouter `SENT_FOR_PAYMENT` et retirer `PAID`
5. Réserver `PAID` pour le futur vrai statut "Payé" (à implémenter plus tard avec la secrétaire et le chef)
6. Re-seeder les données de démo avec des dates récentes et pertinentes

**Statut** : EN ATTENTE DU FEU VERT de l'utilisateur

---

## CE QUI RESTE DU PLAN D'AUDIT ORIGINAL

### Phase 3 — Backend (6 items restants)
1. **Fix N+1 sur `/pacte/teachers`** — Remplacer `Promise.all` par `LEFT JOIN + GROUP BY`
2. **Remplacer xlsx par exceljs** — Bibliothèque async, pas de problèmes de sécurité
3. **Logger structuré** — Créer `server/utils/logger.ts` (JSON en prod, emojis en dev)
4. **Format d'erreur standardisé** — Créer `server/utils/errors.ts` avec classe `AppError`
5. **Validation Zod restante** — Routes PACTE, quotas, import CSV
6. **Filtrage SQL côté serveur** — Stats admin, stats PACTE (certains déjà faits)

### Phase 4 — Frontend (2 items restants)
1. **Supprimer les 33 `any`** — Remplacer par types corrects dans routes et composants
2. **Découper les dashboards** — Extraire hooks (`useSessions`, `useTeachers`), objectif < 500 lignes/fichier

### Phase 5 — DevOps (5 items restants)
1. **`noUnusedLocals`** dans tsconfig.app.json + corriger erreurs
2. **Analyse bundle** — rollup-plugin-visualizer dans vite.config.ts
3. **Documentation backup** — Procédure pg_dump vers S3
4. **Documentation sécurité** — Rotation des secrets
5. **Versionnement S3** — Documenter l'activation sur le bucket Scaleway

### Autre dette technique
- **Soft delete sessions** : intentionnellement reporté (trop risqué pour cette passe)

---

## Fichiers créés pendant l'audit

| Fichier | Description |
|---------|-------------|
| `server/validators/password.ts` | Validation Zod mot de passe |
| `server/validators/user.ts` | Validation Zod mise à jour utilisateur |
| `server/utils/constants.ts` | Constantes (BCRYPT_ROUNDS) |
| `src/contexts/AuthContext.tsx` | Contexte d'authentification React |
| `src/lib/api.ts` | Wrapper fetch centralisé |
| `src/components/ProtectedRoute.tsx` | Route protégée par rôle |
| `src/components/ErrorBoundary.tsx` | Boundary d'erreur React |
| `src/types/index.ts` | Types partagés |
| `vitest.config.ts` | Configuration Vitest |
| `server/validators/__tests__/password.test.ts` | Tests validateur mot de passe |
| `.github/workflows/ci.yml` | CI GitHub Actions |
| `docker-compose.yml` | PostgreSQL local dev |
| `.env.example` | Variables d'environnement documentées |
| `docs/AUDIT-REPORT.md` | Ce fichier |

---

## Comptes de test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| teacher1@example.com | password123 | TEACHER (Sophie MARTIN) |
| teacher2@example.com | password123 | TEACHER (Marie PETIT) |
| teacher3@example.com | password123 | TEACHER (Martin DUBOIS) |
| teacher4@example.com | password123 | TEACHER |
| secretary@example.com | password123 | SECRETARY (créé manuellement) |
| principal@example.com | password123 | PRINCIPAL (créé manuellement) |
| admin@example.com | password123 | ADMIN |

---

## Serveur de développement

```bash
# Lancer le serveur
npm run dev:full
# Frontend : http://localhost:5173/
# Backend  : http://localhost:3001/

# Si le port est occupé, tuer les processus :
lsof -ti :3001 -ti :5173 | sort -u | xargs kill -9

# Health check
curl http://localhost:3001/api/health

# Build
npm run build

# Tests
npm run test:run
```

---

## Notes importantes

- **Neon cold start** : le connect_timeout est à 30s car Neon (free tier, eu-central-1) peut mettre 10-20s à cold start
- **Rate limiter en mémoire** : après un test de brute-force, le rate limiter bloque les logins légitimes → redémarrer le serveur pour reset
- **Vite port** : si le port 5173 est occupé, Vite passe automatiquement au 5174, 5175, etc. Toujours vérifier les logs au démarrage
- **tsx ne hot-reload pas le serveur** : après une modification dans `server/`, il faut redémarrer le serveur manuellement
