@echo off
title SupChaissac - Libération du port 5000
color 0C
echo.
echo ========================================
echo    LIBERATION DU PORT 5000
echo ========================================
echo.
echo Recherche des processus utilisant le port 5000...
echo.

cd /d "%~dp0"

echo Arrêt des processus sur le port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    echo Arrêt du processus PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Vérification...
netstat -aon | find ":5000" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Il reste encore des processus sur le port 5000
    echo Voici les processus actifs :
    netstat -aon | find ":5000"
) else (
    echo ✅ Port 5000 libéré avec succès !
)

echo.
echo ========================================
echo Appuyez sur une touche pour continuer...
echo ========================================
pause >nul
