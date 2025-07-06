@echo off
title SupChaissac - Démarrage complet
color 0C
echo.
echo ========================================
echo    SUPCHAISSAC - DEMARRAGE COMPLET
echo ========================================
echo.
echo Ce script va :
echo 1. Installer les dépendances si nécessaire
echo 2. Démarrer le serveur
echo 3. Ouvrir le navigateur
echo.

cd /d "%~dp0"

echo Vérification de Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ERREUR: Node.js n'est pas installé !
    echo Téléchargez-le depuis: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Libération du port 5000 si nécessaire...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING" 2^>nul') do (
    echo Arrêt du processus utilisant le port 5000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

echo Installation/vérification des dépendances...
call npm install
if %errorlevel% neq 0 (
    echo Erreur lors de l'installation des dépendances.
    pause
    exit /b 1
)

echo.
echo Ouverture du navigateur dans 3 secondes...
timeout /t 3 /nobreak >nul
start http://localhost:5000

echo.
echo Démarrage du serveur...
echo.
echo ========================================
echo SERVEUR EN COURS D'EXECUTION
echo URL: http://localhost:5000
echo Appuyez sur Ctrl+C pour arrêter
echo ========================================
echo.

call npm run dev

echo.
echo ========================================
echo Le serveur s'est arrêté.
echo Appuyez sur une touche pour fermer...
echo ========================================
pause >nul
