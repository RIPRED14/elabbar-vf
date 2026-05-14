/**
 * SCRIPT DE SCRAPING AUTOMATISÉ — Clients & Bateaux NTSAMAK
 * =========================================================
 * 
 * Ce script va parcourir TOUTE la liste des clients et extraire automatiquement
 * leurs bateaux en ouvrant chaque fiche client une par une.
 * 
 * INSTRUCTIONS :
 * 1. Connectez-vous à https://ntsamak.ntwtec.com/#/client-frs
 * 2. Assurez-vous d'être sur la page de la liste des clients.
 * 3. Ouvrez la Console (F12 ou Cmd+Opt+J sur Mac).
 * 4. Collez TOUT ce code et appuyez sur Entrée.
 * 5. ATTENDEZ : Le script va cliquer partout tout seul. Ne touchez à rien jusqu'au message final.
 */

(async function scrapeEverything() {
    console.log('🚀 Démarrage du scraping global...');
    
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const allResults = [];
    
    // Fonction pour scraper une page actuelle
    async function scrapeCurrentPage() {
        const rows = document.querySelectorAll('.p-datatable-tbody tr');
        console.log(`🔍 Traitement de ${rows.length} clients sur cette page...`);
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll('td');
            if (cells.length < 3) continue;
            
            const clientInfo = {
                nom: cells[0]?.innerText?.trim(),
                type: cells[1]?.innerText?.trim(),
                ville: cells[2]?.innerText?.trim(),
                bateaux: []
            };
            
            console.log(`   ➡️ Client: ${clientInfo.nom}`);
            
            // Trouver le bouton éditer (bouton vert avec l'icône crayon)
            const editBtn = row.querySelector('button.p-button-success, .pi-pencil')?.closest('button');
            
            if (editBtn) {
                editBtn.click();
                await sleep(1500); // Attendre l'ouverture de la modale
                
                // Scraper les bateaux dans la modale
                const boatRows = document.querySelectorAll('.p-dialog .p-datatable-tbody tr');
                boatRows.forEach(bRow => {
                    const bCells = bRow.querySelectorAll('td');
                    if (bCells.length >= 2) {
                        const bNom = bCells[0]?.innerText?.trim();
                        const bType = bCells[1]?.innerText?.trim();
                        const bAgrement = bCells[2]?.innerText?.trim() || "";
                        if (bNom && bNom !== "No records found") {
                            clientInfo.bateaux.push({ nom: bNom, type: bType, agrement: bAgrement });
                        }
                    }
                });
                
                console.log(`      ✅ ${clientInfo.bateaux.length} bateaux trouvés.`);
                
                // Fermer la modale (bouton X en haut à droite)
                const closeBtn = document.querySelector('.p-dialog-header-close');
                if (closeBtn) closeBtn.click();
                await sleep(800);
            }
            
            allResults.push(clientInfo);
        }
    }

    // Boucle de pagination
    let hasNext = true;
    while (hasNext) {
        await scrapeCurrentPage();
        
        // Trouver le bouton "Suivant" dans le paginateur
        const nextBtn = document.querySelector('.p-paginator-next:not(.p-disabled)');
        if (nextBtn) {
            console.log('⏭️ Passage à la page suivante...');
            nextBtn.click();
            await sleep(2000);
        } else {
            hasNext = false;
        }
    }
    
    console.log('✨ FIN DU SCRAPING !');
    console.log(`📊 Total: ${allResults.length} clients récupérés.`);
    
    const finalJSON = JSON.stringify(allResults, null, 2);
    console.log('📋 COPIE DANS LE PRESSE-PAPIERS...');
    
    const textArea = document.createElement("textarea");
    textArea.value = finalJSON;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    
    console.log('✅ TERMINÉ ! Le JSON est copié. Vous pouvez maintenant le coller pour Antigravity.');
    console.log(finalJSON);
})();
