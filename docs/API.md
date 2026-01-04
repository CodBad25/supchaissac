# Documentation API - SupChaissac v2.0

## Base URL

- **Développement** : `http://localhost:3001/api`
- **Production** : `https://supchaissacvgfvl03o-supchaissac-app.functions.fnc.fr-par.scw.cloud/api`

## Authentification

L'API utilise des sessions avec cookies. Toutes les routes (sauf `/auth/login`) nécessitent une authentification.

---

## Routes d'authentification

### POST /auth/login

Connexion utilisateur.

**Corps de la requête :**
```json
{
  "username": "email@example.com",
  "password": "password123"
}
```

**Réponse :**
```json
{
  "id": 1,
  "email": "email@example.com",
  "firstName": "Jean",
  "lastName": "DUPONT",
  "role": "TEACHER",
  "inPacte": true
}
```

**Rate limiting** : 5 tentatives / 15 minutes

### POST /auth/logout

Déconnexion utilisateur.

**Réponse :**
```json
{
  "message": "Déconnexion réussie"
}
```

### GET /auth/me

Récupère l'utilisateur connecté.

**Réponse :**
```json
{
  "id": 1,
  "email": "email@example.com",
  "firstName": "Jean",
  "lastName": "DUPONT",
  "role": "TEACHER",
  "inPacte": true,
  "pacteHoursTarget": 24,
  "pacteHoursCompleted": 12
}
```

### PATCH /auth/profile

Modifie le profil de l'utilisateur connecté.

**Corps de la requête :**
```json
{
  "firstName": "Jean",
  "currentPassword": "ancien",
  "newPassword": "nouveau"
}
```

---

## Routes Sessions

### GET /sessions

Liste les sessions de l'utilisateur connecté.

**Query params :**
- `status` : Filtrer par statut (PENDING_REVIEW, VALIDATED, etc.)
- `month` : Filtrer par mois (format: YYYY-MM)

**Réponse :**
```json
[
  {
    "id": 1,
    "date": "2025-01-15",
    "timeSlot": "M2",
    "type": "RCD",
    "status": "VALIDATED",
    "className": "6A",
    "teacherName": "Jean DUPONT"
  }
]
```

### POST /sessions

Crée une nouvelle session.

**Corps de la requête :**
```json
{
  "date": "2025-01-15",
  "timeSlot": "M2",
  "type": "RCD",
  "className": "6A",
  "replacedTeacherPrefix": "M.",
  "replacedTeacherFirstName": "Pierre",
  "replacedTeacherLastName": "MARTIN",
  "subject": "Mathématiques"
}
```

### PUT /sessions/:id

Modifie une session existante.

**Permissions** : Propriétaire uniquement, statut PENDING_REVIEW

### DELETE /sessions/:id

Supprime une session.

**Permissions** : Propriétaire uniquement, statut PENDING_REVIEW

### GET /sessions/admin/all

Liste toutes les sessions (pour secrétariat/direction).

**Permissions** : SECRETARY, PRINCIPAL, ADMIN

### PUT /sessions/:id/review

Passe une session de PENDING_REVIEW à PENDING_VALIDATION.

**Permissions** : SECRETARY, PRINCIPAL

### PUT /sessions/:id/validate

Valide ou rejette une session.

**Corps de la requête :**
```json
{
  "action": "validate",
  "comment": "Commentaire optionnel"
}
```
ou
```json
{
  "action": "reject",
  "rejectionReason": "Motif du rejet"
}
```

**Permissions** : PRINCIPAL

### PUT /sessions/:id/mark-paid

Marque une session comme payée.

**Permissions** : SECRETARY

---

## Routes Pièces jointes

### POST /attachments/upload/:sessionId

Upload un fichier pour une session.

**Form data :**
- `file` : Fichier (max 10 Mo)

**Permissions** : Propriétaire de la session ou staff

### GET /attachments/session/:sessionId

Liste les pièces jointes d'une session.

**Permissions** : Propriétaire de la session ou staff

### GET /attachments/:id/download-url

Génère une URL de téléchargement signée.

**Réponse :**
```json
{
  "url": "https://s3.../file?signature=...",
  "filename": "enseignant_2025-01-15_M2_document.pdf"
}
```

### DELETE /attachments/:id

Supprime une pièce jointe.

**Permissions** : Propriétaire de la session ou staff

### PATCH /attachments/:id/verify

Marque une pièce jointe comme vérifiée.

**Permissions** : SECRETARY, PRINCIPAL

---

## Routes Enseignants

### GET /teachers/search

Recherche d'enseignants (pour autocomplétion).

**Query params :**
- `q` : Terme de recherche (nom ou prénom)

**Réponse :**
```json
[
  {
    "id": 5,
    "firstName": "Pierre",
    "lastName": "MARTIN",
    "civilite": "M.",
    "subject": "Mathématiques",
    "displayName": "M. Pierre MARTIN"
  }
]
```

**Permissions** : Authentifié

---

## Routes Admin

### GET /admin/stats

Statistiques globales.

**Permissions** : ADMIN

### GET /admin/users

Liste tous les utilisateurs.

**Permissions** : ADMIN

### POST /admin/users

Crée un utilisateur.

**Corps de la requête :**
```json
{
  "username": "email@example.com",
  "firstName": "Jean",
  "lastName": "DUPONT",
  "civilite": "M.",
  "role": "TEACHER",
  "subject": "Mathématiques",
  "inPacte": false
}
```

### PATCH /admin/users/:id

Modifie un utilisateur.

### DELETE /admin/users/:id

Supprime un utilisateur.

### POST /admin/users/:id/reset-password

Réinitialise le mot de passe d'un utilisateur.

### POST /admin/users/:id/send-activation

Envoie un email d'activation.

### POST /admin/import-teachers-csv

Importe des enseignants depuis un CSV.

**Form data :**
- `file` : Fichier CSV

### POST /admin/preview-teachers-csv

Prévisualise un import CSV avant confirmation.

---

## Routes PACTE

### GET /pacte/teachers

Liste des enseignants avec leur statut PACTE.

**Permissions** : SECRETARY, PRINCIPAL

### PATCH /pacte/teachers/:id/status

Modifie le statut PACTE d'un enseignant.

**Permissions** : SECRETARY

### PATCH /pacte/teachers/:id/contrat

Modifie le contrat PACTE d'un enseignant.

**Corps de la requête :**
```json
{
  "pacteHoursTarget": 24,
  "pacteHoursDF": 12,
  "pacteHoursRCD": 12
}
```

---

## Routes Élèves

### GET /students

Liste des élèves.

### GET /students/search

Recherche d'élèves.

**Query params :**
- `q` : Terme de recherche
- `className` : Filtrer par classe

### GET /students/classes

Liste des classes disponibles.

### POST /students/import

Importe des élèves depuis un CSV.

**Permissions** : ADMIN

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Permission refusée |
| 404 | Ressource non trouvée |
| 429 | Trop de requêtes (rate limiting) |
| 500 | Erreur serveur |

## Format des erreurs

```json
{
  "error": "Description de l'erreur"
}
```
