/**
 * MIGRATION SCRIPT FOR ELABBAR -> SUPABASE
 * 
 * Instructions:
 * 1. Open your ELABBAR application in Chrome.
 * 2. Press F12 to open DevTools.
 * 3. Go to the "Console" tab.
 * 4. Paste the code below and press Enter.
 */

async function migrateToSupabase() {
    const SUPABASE_URL = 'https://waqfodmwoldhusazcycg.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc'; // ANON KEY
    
    // Check if Supabase client is available
    if (typeof supabase === 'undefined') {
        console.error("❌ Supabase library not found. Please wait for the app to reload with the new script tag.");
        return;
    }

    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const data = JSON.parse(localStorage.getItem('gestprod_data') || '{}');

    if (!data.personnel) {
        console.error("❌ No data found in localStorage ('gestprod_data' is empty).");
        return;
    }

    console.log("🚀 Starting migration...");

    try {
        // 1. Settings
        console.log("--- Migrating Settings ---");
        await sb.from('settings').upsert({
            id: 'global',
            data: data.parametres || {}
        });

        // 2. Personnel
        console.log("--- Migrating Personnel ---");
        if (data.personnel && data.personnel.length > 0) {
            // Clean data to ensure it matches schema types
            const cleanPersonnel = data.personnel.map(p => ({
                id: p.id,
                nom: p.nom || '',
                prenom: p.prenom || '',
                type: p.type || '',
                poste: p.poste || '',
                dept: p.dept || '',
                salaire: parseFloat(p.salaire) || 0,
                actif: p.actif !== false
            }));
            const { error } = await sb.from('personnel').upsert(cleanPersonnel);
            if (error) console.error("Error personnel:", error);
        }

        // 3. Production
        console.log("--- Migrating Production ---");
        if (data.production && data.production.length > 0) {
            const cleanProd = data.production.map(p => ({
                id: p.id || Math.random().toString(36).substr(2, 9),
                date: p.date,
                module: p.module || '',
                espece: p.espece || '',
                lot: p.lot || '',
                client: p.client || '',
                bateau: p.bateau || '',
                poidsMP: parseFloat(p.poidsMP) || 0,
                poidsPF: parseFloat(p.poidsPF) || 0,
                caissesPF: parseInt(p.caissesPF) || 0,
                caissesPI: parseInt(p.caissesPI) || 0,
                produitFini: p.produitFini || '',
                conditionnement: p.conditionnement || '',
                palette: p.palette || ''
            }));
            const { error } = await sb.from('production').upsert(cleanProd);
            if (error) console.error("Error production:", error);
        }

        // 4. Pointage
        console.log("--- Migrating Pointage ---");
        if (data.pointage) {
            const pointages = [];
            for (const date in data.pointage) {
                for (const employeeId in data.pointage[date]) {
                    pointages.push({
                        date: date,
                        employee_id: parseInt(employeeId),
                        hours: data.pointage[date][employeeId]
                    });
                }
            }
            if (pointages.length > 0) {
                const { error } = await sb.from('pointage').upsert(pointages, { onConflict: 'date, employee_id' });
                if (error) console.error("Error pointage:", error);
            }
        }

        // 5. Stockage
        console.log("--- Migrating Stockage ---");
        if (data.stockage && data.stockage.length > 0) {
            const { error } = await sb.from('stockage').upsert(data.stockage);
            if (error) console.error("Error stockage:", error);
        }

        // 6. Factures
        console.log("--- Migrating Factures ---");
        if (data.factures && data.factures.length > 0) {
            const { error } = await sb.from('factures').upsert(data.factures);
            if (error) console.error("Error factures:", error);
        }

        // 7. Clients
        console.log("--- Migrating Clients ---");
        if (data.clients && data.clients.length > 0) {
            const { error } = await sb.from('clients').upsert(data.clients);
            if (error) console.error("Error clients:", error);
        }

        // 8. Consommables
        console.log("--- Migrating Consommables ---");
        if (data.consommables && data.consommables.length > 0) {
            const { error } = await sb.from('consommables').upsert(data.consommables);
            if (error) console.error("Error consommables:", error);
        }

        // 9. Sorties Stockage
        console.log("--- Migrating Sorties Stockage ---");
        if (data.sortiesStockage && data.sortiesStockage.length > 0) {
            const { error } = await sb.from('sortiesStockage').upsert(data.sortiesStockage);
            if (error) console.error("Error sortiesStockage:", error);
        }

        // 10. Mouvements Stock
        console.log("--- Migrating Mouvements Stock ---");
        if (data.mouvementsStock && data.mouvementsStock.length > 0) {
            const { error } = await sb.from('mouvementsStock').upsert(data.mouvementsStock);
            if (error) console.error("Error mouvementsStock:", error);
        }

        // 11. QR Codes
        console.log("--- Migrating QR Codes ---");
        if (data.qrCodes && data.qrCodes.length > 0) {
            const { error } = await sb.from('qrCodes').upsert(data.qrCodes);
            if (error) console.error("Error qrCodes:", error);
        }

        // 12. Espèces
        console.log("--- Migrating Espèces ---");
        if (data.especes && data.especes.length > 0) {
            const { error } = await sb.from('especes').upsert(data.especes);
            if (error) console.error("Error especes:", error);
        }

        // 13. Fiches Pointage
        console.log("--- Migrating Fiches Pointage ---");
        if (data.fiches_pointage && data.fiches_pointage.length > 0) {
            const { error } = await sb.from('fiches_pointage').upsert(data.fiches_pointage);
            if (error) console.error("Error fiches_pointage:", error);
        }

        console.log("✅ Migration complete!");
        alert("Félicitations ! Vos données sont maintenant sur Supabase.");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    }
}

migrateToSupabase();
