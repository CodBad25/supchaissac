@echo off
echo 🗄️ Création de la sauvegarde SupChaissac...

:: Créer un timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%-%HH%-%Min%-%Sec%"

:: Nom de la sauvegarde
set "backup_name=supchaissac-backup-%timestamp%"
set "backup_path=backups\%backup_name%"

echo 📁 Création du dossier : %backup_path%
if not exist backups mkdir backups
mkdir "%backup_path%"

echo 📋 Copie des fichiers essentiels...

:: Copier les dossiers principaux
xcopy /E /I /Q client "%backup_path%\client"
xcopy /E /I /Q server "%backup_path%\server"
xcopy /E /I /Q shared "%backup_path%\shared"
xcopy /E /I /Q scripts "%backup_path%\scripts"
xcopy /E /I /Q docs "%backup_path%\docs"

:: Copier les fichiers de configuration
copy package.json "%backup_path%\"
copy package-lock.json "%backup_path%\"
copy tsconfig.json "%backup_path%\"
copy vite.config.ts "%backup_path%\"
copy tailwind.config.ts "%backup_path%\"
copy postcss.config.js "%backup_path%\"
copy docker-compose.yml "%backup_path%\"
copy .env.example "%backup_path%\"
copy README.md "%backup_path%\"

:: Copier la base de données si elle existe
if exist data xcopy /E /I /Q data "%backup_path%\data"

:: Créer un fichier de métadonnées
echo { > "%backup_path%\BACKUP_INFO.json"
echo   "timestamp": "%timestamp%", >> "%backup_path%\BACKUP_INFO.json"
echo   "date": "%YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%", >> "%backup_path%\BACKUP_INFO.json"
echo   "version": "1.0.0", >> "%backup_path%\BACKUP_INFO.json"
echo   "description": "Sauvegarde complète avant préparation multi-plateforme", >> "%backup_path%\BACKUP_INFO.json"
echo   "platform": "Windows" >> "%backup_path%\BACKUP_INFO.json"
echo } >> "%backup_path%\BACKUP_INFO.json"

:: Créer un README
echo # Sauvegarde SupChaissac - %timestamp% > "%backup_path%\README_BACKUP.md"
echo. >> "%backup_path%\README_BACKUP.md"
echo ## 📋 Contenu de la sauvegarde >> "%backup_path%\README_BACKUP.md"
echo. >> "%backup_path%\README_BACKUP.md"
echo Cette sauvegarde contient : >> "%backup_path%\README_BACKUP.md"
echo - ✅ Code source complet >> "%backup_path%\README_BACKUP.md"
echo - ✅ Base de données SQLite >> "%backup_path%\README_BACKUP.md"
echo - ✅ Configuration Docker >> "%backup_path%\README_BACKUP.md"
echo - ✅ Documentation existante >> "%backup_path%\README_BACKUP.md"
echo. >> "%backup_path%\README_BACKUP.md"
echo ## 🚀 Restauration >> "%backup_path%\README_BACKUP.md"
echo. >> "%backup_path%\README_BACKUP.md"
echo 1. Copier tous les fichiers dans un nouveau dossier >> "%backup_path%\README_BACKUP.md"
echo 2. Installer les dépendances : `npm install` >> "%backup_path%\README_BACKUP.md"
echo 3. Démarrer l'application : `npm run dev` >> "%backup_path%\README_BACKUP.md"

echo ✅ Sauvegarde créée avec succès !
echo 📁 Emplacement : %backup_path%
echo 🗂️ Contenu sauvegardé :
echo    - Code source complet
echo    - Base de données SQLite
echo    - Configuration et documentation

pause
