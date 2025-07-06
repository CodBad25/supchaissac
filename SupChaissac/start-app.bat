@echo off
echo Démarrage de l'application SupChaissac...
echo.

cd %~dp0
echo Répertoire courant: %CD%
echo.

echo Vérification de l'installation de Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js n'est pas installé ou n'est pas dans le PATH.
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo Installation des dépendances...
call npm install
if %errorlevel% neq 0 (
    echo Erreur lors de l'installation des dépendances.
    pause
    exit /b 1
)
echo.

echo Démarrage du serveur de développement...
call npm run dev
if %errorlevel% neq 0 (
    echo Erreur lors du démarrage du serveur de développement.
    pause
    exit /b 1
)
echo.

pause
