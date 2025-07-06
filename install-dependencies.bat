@echo off
title SupChaissac - Installation des dépendances
color 0B
echo.
echo ========================================
echo    SUPCHAISSAC - INSTALLATION
echo ========================================
echo.
echo Installation des dépendances npm...
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

echo Node.js trouvé !
echo.
echo Installation en cours...
call npm install

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Installation terminée avec succès !
    echo Vous pouvez maintenant lancer le serveur.
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERREUR lors de l'installation !
    echo ========================================
)

echo.
pause
