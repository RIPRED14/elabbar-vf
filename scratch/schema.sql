-- Schema SQL compatible avec les IDs existants de ELABBAR ERP
-- À exécuter dans le SQL Editor de Supabase

-- 1. Table des Paramètres
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
    id TEXT PRIMARY KEY, -- 'global'
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table du Personnel
DROP TABLE IF EXISTS personnel;
CREATE TABLE personnel (
    id BIGINT PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT,
    type TEXT,
    poste TEXT,
    dept TEXT,
    salaire NUMERIC DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table de Production
DROP TABLE IF EXISTS production;
CREATE TABLE production (
    id TEXT PRIMARY KEY, -- Les lots/ids de l'app sont souvent des strings ou générés
    date DATE NOT NULL,
    module TEXT,
    espece TEXT,
    lot TEXT,
    client TEXT,
    bateau TEXT,
    poidsMP NUMERIC,
    poidsPF NUMERIC,
    caissesPF INTEGER,
    caissesPI INTEGER,
    produitFini TEXT,
    conditionnement TEXT,
    palette TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table de Pointage
DROP TABLE IF EXISTS pointage;
CREATE TABLE pointage (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    employee_id BIGINT, -- Correspond à personnel.id
    hours NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, employee_id)
);

-- 5. Table de Stockage
DROP TABLE IF EXISTS stockage;
CREATE TABLE stockage (
    id TEXT PRIMARY KEY,
    lot TEXT,
    chambre TEXT,
    espece TEXT,
    calibre TEXT,
    poids NUMERIC,
    nb_caisses INTEGER,
    date_entree DATE,
    date_sortie DATE,
    statut TEXT,
    client TEXT,
    provenance TEXT,
    type_produit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table des Factures
DROP TABLE IF EXISTS factures;
CREATE TABLE factures (
    id TEXT PRIMARY KEY,
    numero TEXT,
    date DATE,
    fournisseur TEXT,
    montantHT NUMERIC,
    tva NUMERIC,
    montantTTC NUMERIC,
    devise TEXT,
    motif TEXT,
    lignes JSONB, -- Détails des articles
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table des Clients
DROP TABLE IF EXISTS clients;
CREATE TABLE clients (
    id BIGINT PRIMARY KEY,
    nom TEXT,
    type TEXT,
    ville TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Table des Consommables
DROP TABLE IF EXISTS consommables;
CREATE TABLE consommables (
    id BIGINT PRIMARY KEY,
    nom TEXT,
    unite TEXT,
    stock NUMERIC,
    seuilCritique NUMERIC,
    seuilAlerte NUMERIC,
    prixUnitaire NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Table des Sorties Stockage
DROP TABLE IF EXISTS sortiesStockage;
CREATE TABLE sortiesStockage (
    id TEXT PRIMARY KEY,
    date DATE,
    client TEXT,
    items JSONB, -- Liste des lots sortis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Table des Mouvements Stock
DROP TABLE IF EXISTS mouvementsStock;
CREATE TABLE mouvementsStock (
    id TEXT PRIMARY KEY,
    date DATE,
    type TEXT, -- 'ENTREE', 'SORTIE'
    article TEXT,
    quantite NUMERIC,
    commentaire TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Table des QR Codes
DROP TABLE IF EXISTS qrCodes;
CREATE TABLE qrCodes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Table des Espèces
DROP TABLE IF EXISTS especes;
CREATE TABLE especes (
    nom TEXT PRIMARY KEY,
    prixMoyenVente NUMERIC DEFAULT 0,
    calibres JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Table des Fiches de Pointages (personnel)
DROP TABLE IF EXISTS fiches_pointage;
CREATE TABLE fiches_pointage (
    id BIGINT PRIMARY KEY,
    date DATE,
    activite TEXT,
    titre TEXT,
    presences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Désactivation RLS pour la migration
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE personnel DISABLE ROW LEVEL SECURITY;
ALTER TABLE production DISABLE ROW LEVEL SECURITY;
ALTER TABLE pointage DISABLE ROW LEVEL SECURITY;
ALTER TABLE stockage DISABLE ROW LEVEL SECURITY;
ALTER TABLE factures DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE consommables DISABLE ROW LEVEL SECURITY;
ALTER TABLE sortiesStockage DISABLE ROW LEVEL SECURITY;
ALTER TABLE mouvementsStock DISABLE ROW LEVEL SECURITY;
ALTER TABLE qrCodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE especes DISABLE ROW LEVEL SECURITY;
ALTER TABLE fiches_pointage DISABLE ROW LEVEL SECURITY;
