# 🎨 Design System - Guide Rapide

## 🚀 Démarrage Rapide

```tsx
// 1. Importer
import { components, colors, cn } from '@/styles/theme';

// 2. Utiliser
<button className={components.button.primary}>
  Mon bouton
</button>
```

## 📦 Fichiers

| Fichier | Description |
|---------|-------------|
| `theme.ts` | ✅ **Fichier principal** - Toutes les définitions |
| `README.md` | Guide rapide (ce fichier) |

## 🎨 Composants Principaux

### Boutons

```tsx
// Bouton principal (jaune)
<button className={components.button.primary}>
  Action principale
</button>

// Bouton secondaire
<button className={components.button.secondary}>
  Action secondaire
</button>

// Bouton danger
<button className={components.button.danger}>
  Supprimer
</button>

// Petit bouton
<button className={cn(
  components.button.primary,
  components.button.small
)}>
  Petit
</button>
```

### Cartes

```tsx
// Carte avec effet verre
<div className={components.card.glass}>
  Contenu
</div>

// Carte simple
<div className={components.card.simple}>
  Contenu
</div>

// Carte cliquable
<div className={components.card.clickable}>
  Cliquez-moi
</div>
```

### Inputs

```tsx
// Input standard
<input
  type="text"
  className={components.input.base}
  placeholder="Texte"
/>

// Input avec erreur
<input
  type="text"
  className={cn(components.input.base, components.input.error)}
/>
```

### Labels

```tsx
<label className={components.label}>
  <Icon className="w-3 h-3 text-yellow-500" />
  Libellé
</label>
```

### Badges

```tsx
import { getStatusClasses } from '@/styles/theme';

const statusClasses = getStatusClasses('VALIDATED');

<span className={cn(components.badge.base, statusClasses.full)}>
  {statusClasses.label}
</span>
```

## 🎨 Couleurs Métier

### Par Statut

```tsx
import { getStatusClasses } from '@/styles/theme';

const classes = getStatusClasses('VALIDATED');
// Retourne: { bg, text, border, full, icon, label }

<div className={classes.full}>
  {classes.label}
</div>
```

**Statuts disponibles :**
- `PENDING_REVIEW` - Orange
- `PENDING_VALIDATION` - Ambre
- `VALIDATED` - Vert clair (green-50)
- `PAID` - Vert intense (green-300) - Note: signifie "Mis en paiement", pas "Payé"
- `REJECTED` - Rouge
- `PAYMENT_COMPLETED` - (futur) Vert-bleu pour "Payé" effectif

### Par Niveau de Classe

```tsx
import { getGradeClasses } from '@/styles/theme';

const classes = getGradeClasses('6e');

<div className={classes.full}>
  6ème
</div>
```

**Niveaux disponibles :**
- `6e` - Vert émeraude
- `5e` - Bleu
- `4e` - Violet
- `3e` - Rouge
- `mixte` - Gris

### Par Type de Session

```tsx
import { getSessionTypeClasses } from '@/styles/theme';

const classes = getSessionTypeClasses('RCD');

<div className={classes.full}>
  RCD
</div>
```

**Types disponibles :**
- `RCD` - Violet
- `DEVOIRS_FAITS` - Bleu
- `AUTRE` - Jaune

## 🔧 Utilitaires

### Fonction `cn()` - Combiner des classes

```tsx
import { cn } from '@/styles/theme';

// Combiner des classes conditionnellement
<button className={cn(
  components.button.primary,
  components.button.small,
  isLoading && 'opacity-50',
  'flex items-center gap-2'
)}>
  Bouton
</button>
```

## 🎬 Animations

```tsx
// Fade in
<div className="animate-fade-in">Contenu</div>

// Slide in depuis le bas
<div className="animate-slide-in-bottom">Contenu</div>

// Slide in depuis la gauche
<div className="animate-slide-in-left">Contenu</div>

// Blob (background animé)
<div className="animate-blob bg-yellow-200/20 rounded-full" />
```

## ♿ Accessibilité

### Focus States (TOUJOURS INCLURE)

```tsx
// Déjà inclus dans les composants pré-définis
<button className={components.button.primary}>
  OK ✅
</button>

// Pour composants custom
<button className="... focus:outline-none focus:ring-4 focus:ring-yellow-200">
  Custom avec focus
</button>
```

### ARIA Labels

```tsx
<button aria-label="Fermer la modale">
  <X className="w-5 h-5" />
</button>
```

## 📚 Documentation Complète

- **Guide complet** : `/DESIGN-SYSTEM.md` (racine du projet)
- **Styleguide visuel** : `http://localhost:5173/styleguide`
- **Exemple d'utilisation** : `/src/components/ExampleComponent.tsx`

## 🎯 Exemple Complet

```tsx
import React from 'react';
import { Check, X } from 'lucide-react';
import {
  components,
  colors,
  cn,
  getStatusClasses,
  getGradeClasses
} from '@/styles/theme';

const MyComponent = () => {
  const statusClasses = getStatusClasses('VALIDATED');
  const gradeClasses = getGradeClasses('6e');

  return (
    <div className={components.card.glass}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Ma Session</h2>
        <span className={cn(components.badge.base, statusClasses.full)}>
          {statusClasses.label}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <span className={cn(components.badge.base, gradeClasses.full)}>
          6eA
        </span>

        {/* Form */}
        <div>
          <label className={components.label}>Email</label>
          <input
            type="email"
            className={components.input.base}
            placeholder="email@example.com"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className={components.button.primary}>
            <Check className="w-5 h-5" />
            Valider
          </button>
          <button className={components.button.secondary}>
            <X className="w-5 h-5" />
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyComponent;
```

## 🔥 Bonnes Pratiques

### ✅ À FAIRE

```tsx
// Utiliser les composants pré-définis
<button className={components.button.primary}>OK</button>

// Combiner avec cn()
<button className={cn(components.button.primary, 'flex gap-2')}>OK</button>

// Utiliser les helpers
const classes = getStatusClasses('VALIDATED');
```

### ❌ À ÉVITER

```tsx
// Ne pas réinventer les composants
<button className="bg-yellow-500 text-white py-3 px-6 rounded-xl...">
  NON ❌
</button>

// Ne pas ignorer l'accessibilité
<button className="bg-yellow-500">  {/* Pas de focus state ❌ */}
  NON
</button>

// Ne pas hardcoder les couleurs métier
<span className="bg-green-100 text-green-800">  {/* Utiliser getStatusClasses ❌ */}
  NON
</span>
```

## 🆘 Aide

**Problème ?** Consultez :
1. Ce fichier (guide rapide)
2. `/DESIGN-SYSTEM.md` (documentation complète)
3. `/src/pages/StyleguidePage.tsx` (exemples visuels)
4. `/src/components/ExampleComponent.tsx` (code d'exemple)

---

**🎨 Design System créé le 8 novembre 2025**
