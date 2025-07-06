@echo off
title SupChaissac - Serveur de développement
color 0A
echo.
echo ========================================
echo    SUPCHAISSAC - SERVEUR DE DEV
echo ========================================
echo.
echo Démarrage du serveur...
echo.

cd /d "%~dp0"

echo Libération du port 5000 si nécessaire...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING" 2^>nul') do (
    echo Arrêt du processus utilisant le port 5000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

echo Lancement de npm run dev...
echo.
call npm run dev

echo.
echo ========================================
echo Le serveur s'est arrêté.
echo Appuyez sur une touche pour fermer...
echo ========================================
pause >nul
