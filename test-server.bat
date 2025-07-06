@echo off
title SupChaissac - Test du serveur
color 0D
echo.
echo ========================================
echo    TEST DU SERVEUR SUPCHAISSAC
echo ========================================
echo.

cd /d "%~dp0"

echo Test 1: Vérification du port 5000...
netstat -ano | findstr :5000 >nul
if %errorlevel% equ 0 (
    echo ✅ Le serveur écoute sur le port 5000
) else (
    echo ❌ Aucun serveur détecté sur le port 5000
    echo Lancez d'abord start-server.bat
    pause
    exit /b 1
)

echo.
echo Test 2: Test de l'API utilisateur...
curl -s http://localhost:5000/api/user >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ L'API répond
) else (
    echo ❌ L'API ne répond pas
)

echo.
echo Test 3: Test de la page principale...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ La page principale répond
) else (
    echo ❌ La page principale ne répond pas
)

echo.
echo ========================================
echo Tests terminés !
echo.
echo URL à utiliser: http://localhost:5000
echo.
echo Comptes de test (mot de passe: password123):
echo - teacher1@example.com (Sophie MARTIN)
echo - secretary@example.com (Laure MARTIN)  
echo - principal@example.com (Jean DUPONT)
echo - admin@example.com (Admin)
echo ========================================
echo.
pause
