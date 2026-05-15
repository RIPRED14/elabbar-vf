-- ============================================
-- RCG-HAMZA — SCHÉMA COMPLET SUPABASE (V2)
-- ============================================

-- 0. Table des Paramètres (Settings)
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
    id TEXT PRIMARY KEY,
    data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1. Table du Personnel
DROP TABLE IF EXISTS personnel;
CREATE TABLE personnel (
    id BIGINT PRIMARY KEY,
    nom TEXT,
    prenom TEXT,
    cin TEXT,
    telephone TEXT,
    type TEXT,
    poste TEXT,
    dept TEXT,
    dateEmbauche DATE,
    actif BOOLEAN DEFAULT true,
    salaire NUMERIC,
    cnss TEXT,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table de Production
DROP TABLE IF EXISTS production;
CREATE TABLE production (
    id BIGINT PRIMARY KEY,
    activite TEXT,
    date DATE,
    espece TEXT,
    client TEXT,
    poidsBrutPF NUMERIC,
    rendement NUMERIC,
    coutMOJ NUMERIC,
    prixRevient NUMERIC,
    sourceSortieId BIGINT,
    sourceLineIdx INTEGER,
    receptionId BIGINT,
    calibre TEXT,
    produitFini TEXT,
    poidsMP NUMERIC,
    prixMP NUMERIC,
    valeurMP NUMERIC,
    caissesPF INTEGER,
    conditionnement TEXT,
    phases JSONB,
    phasesPF JSONB,
    intrants JSONB,
    totalIntrants NUMERIC,
    coutFactureParKg NUMERIC,
    heuresMOF NUMERIC,
    salaireHF NUMERIC,
    coutPersonnelF NUMERIC,
    equipesMO JSONB,
    coutMOO NUMERIC,
    poidsBrutPI NUMERIC,
    caissesPI INTEGER,
    coutCarton NUMERIC,
    coutSachet NUMERIC,
    coutEtiquetteNoir NUMERIC,
    coutEtiquette5075 NUMERIC,
    coutScotch NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table de Pointage (Vraie table relationnelle)
DROP TABLE IF EXISTS pointage;
CREATE TABLE pointage (
    date DATE,
    employee_id BIGINT,
    hours NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (date, employee_id)
);

-- 4. Table de Stockage (Réceptions)
DROP TABLE IF EXISTS stockage;
CREATE TABLE stockage (
    id BIGINT PRIMARY KEY,
    reference TEXT,
    dateEntree DATE,
    client TEXT,
    fournisseur TEXT,
    bateau TEXT,
    consignataire TEXT,
    vehicule TEXT,
    refCapture TEXT,
    sejour TEXT,
    dateSortie DATE,
    origine TEXT,
    tarePaletteDefaut NUMERIC,
    lignes JSONB,
    sourceProductionId BIGINT,
    sourceProductionType TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table des Factures
DROP TABLE IF EXISTS factures;
CREATE TABLE factures (
    id BIGINT PRIMARY KEY,
    date DATE,
    fournisseur TEXT,
    numero TEXT,
    etatPaiement TEXT,
    motif TEXT,
    montantHT NUMERIC,
    tva NUMERIC,
    montant NUMERIC,
    devise TEXT,
    lignes JSONB,
    allocation TEXT,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table des Clients
DROP TABLE IF EXISTS clients;
CREATE TABLE clients (
    id BIGINT PRIMARY KEY,
    nom TEXT,
    adresse TEXT,
    telephone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table des Consommables
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

-- 8. Table des Sorties Stockage
DROP TABLE IF EXISTS sortiesStockage;
CREATE TABLE sortiesStockage (
    id BIGINT PRIMARY KEY,
    dateSortie DATE,
    receptionId BIGINT,
    lineIdx INTEGER,
    lotRef TEXT,
    espece TEXT,
    calibre TEXT,
    quantite NUMERIC,
    poidsSorti NUMERIC,
    destination TEXT,
    client TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Table des Mouvements Stock
DROP TABLE IF EXISTS mouvementsStock;
CREATE TABLE mouvementsStock (
    id BIGINT PRIMARY KEY,
    date DATE,
    type TEXT, -- 'ENTREE', 'SORTIE'
    article TEXT,
    quantite NUMERIC,
    commentaire TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Table des QR Codes
DROP TABLE IF EXISTS qrCodes;
CREATE TABLE qrCodes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DÉSACTIVATION RLS (POUR LA MIGRATION/DEV)
-- ============================================
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
