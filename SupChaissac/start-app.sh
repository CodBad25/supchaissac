#!/bin/bash

echo "Démarrage de l'application SupChaissac..."
echo ""

# Aller dans le répertoire du script
cd "$(dirname "$0")"
echo "Répertoire courant: $(pwd)"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "Node.js n'est pas installé ou n'est pas dans le PATH."
    echo "Veuillez installer Node.js depuis https://nodejs.org/"
    read -p "Appuyez sur Entrée pour continuer..."
    exit 1
fi

echo "Installation des dépendances..."
npm install
if [ $? -ne 0 ]; then
    echo "Erreur lors de l'installation des dépendances."
    read -p "Appuyez sur Entrée pour continuer..."
    exit 1
fi
echo ""

echo "Démarrage du serveur de développement..."
npm run dev
if [ $? -ne 0 ]; then
    echo "Erreur lors du démarrage du serveur de développement."
    read -p "Appuyez sur Entrée pour continuer..."
    exit 1
fi
echo ""

read -p "Appuyez sur Entrée pour continuer..."
