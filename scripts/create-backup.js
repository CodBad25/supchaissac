import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Fonction pour créer un timestamp
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// Fonction pour copier récursivement un dossier
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Ignorer certains dossiers
    if (entry.name === 'node_modules' || 
        entry.name === '.git' || 
        entry.name === 'dist' ||
        entry.name === 'tmp') {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Fonction principale de sauvegarde
function createBackup() {
  const timestamp = getTimestamp();
  const backupName = `supchaissac-backup-${timestamp}`;
  const backupPath = path.join('backups', backupName);
  
  console.log(`🗄️ Création de la sauvegarde : ${backupName}`);
  
  // Créer le dossier de sauvegarde
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups');
  }
  
  // Copier tous les fichiers du projet
  console.log('📁 Copie des fichiers du projet...');
  copyDir('.', backupPath);
  
  // Créer un fichier de métadonnées
  const metadata = {
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    description: "Sauvegarde complète avant préparation multi-plateforme",
    includes: [
      "Code source complet",
      "Base de données SQLite",
      "Configuration Docker",
      "Documentation existante",
      "Assets et fichiers statiques"
    ],
    environment: {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch
    },
    database: {
      type: "SQLite",
      file: "data/supchaissac.db",
      size_mb: fs.existsSync('data/supchaissac.db') ? 
        (fs.statSync('data/supchaissac.db').size / 1024 / 1024).toFixed(2) : 
        "N/A"
    }
  };
  
  fs.writeFileSync(
    path.join(backupPath, 'BACKUP_METADATA.json'), 
    JSON.stringify(metadata, null, 2)
  );
  
  // Créer un README pour la sauvegarde
  const readmeContent = `# Sauvegarde SupChaissac - ${timestamp}

## 📋 Contenu de la sauvegarde

Cette sauvegarde contient :
- ✅ Code source complet
- ✅ Base de données SQLite avec données de test
- ✅ Configuration Docker
- ✅ Documentation existante
- ✅ Fichiers de configuration (.env, package.json, etc.)

## 🚀 Restauration

Pour restaurer cette sauvegarde :

1. Copier tous les fichiers dans un nouveau dossier
2. Installer les dépendances : \`npm install\`
3. Démarrer l'application : \`npm run dev\`

## 📊 Informations techniques

- **Date de création** : ${new Date().toLocaleString('fr-FR')}
- **Version Node.js** : ${process.version}
- **Plateforme** : ${process.platform}
- **Taille base de données** : ${metadata.database.size_mb} MB

## 🔧 Configuration requise

- Node.js 18+
- npm ou yarn
- Docker (optionnel pour PostgreSQL)

## 📞 Support

En cas de problème avec cette sauvegarde, vérifier :
1. Les versions Node.js et npm
2. Les permissions de fichiers
3. La présence de tous les fichiers listés dans BACKUP_METADATA.json
`;

  fs.writeFileSync(
    path.join(backupPath, 'README_BACKUP.md'), 
    readmeContent
  );
  
  // Calculer la taille totale
  function getDirSize(dirPath) {
    let size = 0;
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
    
    return size;
  }
  
  const totalSize = getDirSize(backupPath);
  const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
  
  console.log(`✅ Sauvegarde créée avec succès !`);
  console.log(`📁 Emplacement : ${backupPath}`);
  console.log(`📊 Taille : ${sizeMB} MB`);
  console.log(`🗂️ Fichiers inclus :`);
  console.log(`   - Code source complet`);
  console.log(`   - Base de données SQLite (${metadata.database.size_mb} MB)`);
  console.log(`   - Configuration et documentation`);
  
  return backupPath;
}

// Exécuter la sauvegarde
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    createBackup();
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde :', error.message);
    process.exit(1);
  }
}

export { createBackup };
