#!/usr/bin/env node

// Script de build optimisé pour Render
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Build SupChaissac pour Render...');

try {
  // 1. Build du client
  console.log('📦 Build du frontend...');
  execSync('vite build', { stdio: 'inherit' });
  
  // 2. Build du serveur
  console.log('⚙️ Build du backend...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  // 3. Copier les fichiers nécessaires
  console.log('📁 Copie des fichiers...');
  
  // Copier shared/ (compatible Windows/Linux)
  if (fs.existsSync('shared')) {
    const copyRecursive = (src, dest) => {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          copyRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    copyRecursive('shared', 'dist/shared');
  }
  
  // Créer package.json pour production
  const prodPackage = {
    "name": "supchaissac",
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "start": "node index.js"
    },
    "dependencies": {
      "express": "^4.18.2",
      "drizzle-orm": "^0.29.0",
      "postgres": "^3.4.3",
      "passport": "^0.7.0",
      "passport-local": "^1.0.0",
      "express-session": "^1.17.3",
      "connect-pg-simple": "^9.0.1",
      "dotenv": "^16.3.1",
      "zod": "^3.22.4"
    }
  };
  
  fs.writeFileSync('dist/package.json', JSON.stringify(prodPackage, null, 2));
  
  console.log('✅ Build terminé avec succès !');
  
} catch (error) {
  console.error('❌ Erreur lors du build :', error.message);
  process.exit(1);
}
