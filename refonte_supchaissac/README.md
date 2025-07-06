# Refonte SupChaissac

Ce dossier contient la nouvelle architecture du projet SupChaissac, basée sur les meilleures pratiques modernes pour une application web fullstack TypeScript/React/Express.

## Structure du projet

```
refonte_supchaissac/
  client/
    src/
      features/
      components/
      hooks/
      lib/
      pages/
      App.tsx
      main.tsx
    tailwind.config.ts
    vite.config.ts
    tsconfig.json
    package.json
  server/
    src/
      features/
      middlewares/
      utils/
      app.ts
      index.ts
    drizzle.config.ts
    tsconfig.json
    package.json
  shared/
    models/
    schemas/
    types/
  .env.example
  README.md
```

- Chaque dossier "features" contient la logique métier d'une fonctionnalité (auth, sessions, users, etc.).
- Les middlewares et utilitaires sont séparés côté serveur.
- Les modèles, schémas et types partagés sont dans `shared/`.
- Les fichiers de configuration et de dépendances sont présents pour chaque partie.

## Pour démarrer

1. Installe les dépendances dans `client/` et `server/`.
2. Configure `.env` à partir de `.env.example`.
3. Lance le backend puis le frontend.

---

Ce squelette est prêt à recevoir les migrations de ton ancien code, refactorisé par feature et selon les bonnes pratiques.
