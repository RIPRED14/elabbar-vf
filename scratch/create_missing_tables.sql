-- ==============================================
-- ELABBAR ERP — Tables et colonnes manquantes
-- Exécuter dans le SQL Editor de Supabase
-- ==============================================

-- 1. Table des Espèces
CREATE TABLE IF NOT EXISTS especes (
    nom TEXT PRIMARY KEY,
    "prixMoyenVente" NUMERIC DEFAULT 0,
    calibres JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE especes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON especes FOR ALL USING (true);

-- 2. Table des Fiches de Pointages (personnel)
CREATE TABLE IF NOT EXISTS fiches_pointage (
    id BIGINT PRIMARY KEY,
    date DATE,
    activite TEXT,
    titre TEXT,
    presences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE fiches_pointage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON fiches_pointage FOR ALL USING (true);

-- 3. Ajouter la colonne 'bateaux' manquante dans la table clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'bateaux'
  ) THEN
    ALTER TABLE clients ADD COLUMN bateaux JSONB;
  END IF;
END $$;

-- 4. Ajouter la colonne 'prixUnitaire' manquante dans la table consommables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consommables' AND column_name = 'prixUnitaire'
  ) THEN
    ALTER TABLE consommables ADD COLUMN "prixUnitaire" NUMERIC DEFAULT 0;
  END IF;
END $$;

-- 5. Ajouter la colonne 'activite' manquante dans la table production
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'production' AND column_name = 'activite'
  ) THEN
    ALTER TABLE production ADD COLUMN activite TEXT;
  END IF;
END $$;

-- 6. Ajouter la contrainte unique sur la table pointage (date, employee_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'pointage' AND (constraint_name = 'pointage_date_employee_id_key' OR constraint_type = 'UNIQUE')
  ) THEN
    -- Nettoyer les doublons potentiels avant d'appliquer la contrainte d'unicité
    DELETE FROM pointage a USING pointage b 
    WHERE a.id < b.id AND a.date = b.date AND a.employee_id = b.employee_id;
    
    ALTER TABLE pointage ADD CONSTRAINT pointage_date_employee_id_key UNIQUE (date, employee_id);
  END IF;
END $$;

