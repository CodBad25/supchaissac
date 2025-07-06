-- Script d'initialisation de la base de données SupChaissac
-- Ce script est exécuté automatiquement lors du premier démarrage de PostgreSQL

-- Créer la base de données si elle n'existe pas déjà
-- (PostgreSQL dans Docker la crée automatiquement via POSTGRES_DB)

-- Configurer l'encodage et les paramètres
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- Créer des extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Base de données SupChaissac initialisée avec succès !';
END $$;
