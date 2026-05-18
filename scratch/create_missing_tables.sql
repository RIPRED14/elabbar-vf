-- Tables manquantes dans Supabase
-- Exécuter dans le SQL Editor de Supabase

-- 1. Table des Espèces
CREATE TABLE IF NOT EXISTS especes (
    nom TEXT PRIMARY KEY,
    "prixMoyenVente" NUMERIC DEFAULT 0,
    calibres JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE especes DISABLE ROW LEVEL SECURITY;

-- 2. Table des Fiches de Pointages (personnel)
CREATE TABLE IF NOT EXISTS fiches_pointage (
    id BIGINT PRIMARY KEY,
    date DATE,
    activite TEXT,
    titre TEXT,
    presences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE fiches_pointage DISABLE ROW LEVEL SECURITY;
