-- 1. Create missing table: especes
CREATE TABLE IF NOT EXISTS especes (
    nom TEXT PRIMARY KEY,
    "prixMoyenVente" NUMERIC DEFAULT 0,
    calibres JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create missing table: fiches_pointage
CREATE TABLE IF NOT EXISTS fiches_pointage (
    id BIGINT PRIMARY KEY,
    date DATE,
    activite TEXT,
    titre TEXT,
    presences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Update consommables table
ALTER TABLE consommables ADD COLUMN IF NOT EXISTS categorie TEXT;
-- Notice: if seuilCritique is sending as camelCase, we might need these columns to match exactly.
-- If they already exist as lowercase in Supabase, we might need to rename them or recreate them.
ALTER TABLE consommables ADD COLUMN IF NOT EXISTS "seuilCritique" NUMERIC;
ALTER TABLE consommables ADD COLUMN IF NOT EXISTS "seuilAlerte" NUMERIC;
ALTER TABLE consommables ADD COLUMN IF NOT EXISTS "prixUnitaire" NUMERIC;

-- 4. Update mouvementsStock table
ALTER TABLE "mouvementsStock" ADD COLUMN IF NOT EXISTS consommable TEXT;
ALTER TABLE "mouvementsStock" ADD COLUMN IF NOT EXISTS motif TEXT;
ALTER TABLE "mouvementsStock" ADD COLUMN IF NOT EXISTS "prixUnit" NUMERIC;
-- Since IDs can be UUID strings, ensure 'id' is TEXT (it should already be according to schema.sql)
ALTER TABLE "mouvementsStock" ALTER COLUMN id TYPE TEXT;

-- 5. Update production table
ALTER TABLE production ADD COLUMN IF NOT EXISTS activite TEXT;
ALTER TABLE production ADD COLUMN IF NOT EXISTS calibre TEXT;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "caissesPI" NUMERIC;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "poidsBrutPI" NUMERIC;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "poidsBrutPF" NUMERIC;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "reliquatNom" TEXT;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "reliquatPoids" NUMERIC;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "allocationPeriod" TEXT;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "equipesMO" JSONB;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "coutMOO" NUMERIC;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "heuresMOF" NUMERIC;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "salaireHF" NUMERIC;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "coutPersonnelF" NUMERIC;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "coutMOJ" NUMERIC;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "phasesPF" JSONB;
ALTER TABLE production ADD COLUMN IF NOT EXISTS intrants JSONB;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "totalIntrants" NUMERIC;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "prixMP" NUMERIC;
ALTER TABLE production ADD COLUMN IF NOT EXISTS "valeurMP" NUMERIC;
ALTER TABLE production ADD COLUMN IF NOT EXISTS rendement NUMERIC;

-- Ensure RLS is disabled for the new tables so the frontend can interact without auth limits (as per original schema)
ALTER TABLE especes DISABLE ROW LEVEL SECURITY;
ALTER TABLE fiches_pointage DISABLE ROW LEVEL SECURITY;
