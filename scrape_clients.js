/**
 * SCRIPT DE SCRAPING — Clients/Fournisseurs NTSAMAK
 * ================================================
 * 
 * INSTRUCTIONS :
 * 1. Ouvrez https://ntsamak.ntwtec.com/#/client-frs dans Chrome
 * 2. Attendez que la liste complète soit chargée (scrollez en bas)
 * 3. Ouvrez la Console (F12 → Console)
 * 4. Collez ce script et appuyez sur Entrée
 * 5. Le JSON sera copié dans votre presse-papiers ET affiché dans la console
 * 6. Collez le résultat dans un fichier scraped_clients.json
 */

(async function scrapeClients() {
  console.log('🔄 Scraping des clients/fournisseurs NTSAMAK...');
  
  // Get all rows from the table
  const rows = document.querySelectorAll('p-table tbody tr, .p-datatable-tbody tr, table tbody tr');
  
  if (rows.length === 0) {
    console.error('❌ Aucune ligne trouvée. Vérifiez que la liste est chargée.');
    return;
  }
  
  const clients = [];
  
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td');
    if (cells.length < 3) continue;
    
    const nom = cells[0]?.textContent?.trim() || '';
    const type = cells[1]?.textContent?.trim() || '';
    const ville = cells[2]?.textContent?.trim() || '';
    const devise = cells[3]?.textContent?.trim() || '';
    const adresse = cells[4]?.textContent?.trim() || '';
    const telephone = cells[5]?.textContent?.trim() || '';
    const fax = cells[6]?.textContent?.trim() || '';
    const formeJuridique = cells[7]?.textContent?.trim() || '';
    const email = cells[8]?.textContent?.trim() || '';
    const nIF = cells[9]?.textContent?.trim() || '';
    const nRC = cells[10]?.textContent?.trim() || '';
    
    if (!nom) continue;
    
    clients.push({
      nom,
      type,
      ville,
      devise,
      adresse,
      telephone,
      fax,
      formeJuridique,
      email,
      nIF,
      nRC,
      bateaux: [] // Will be filled by scraping each client's detail
    });
  }
  
  console.log(`✅ ${clients.length} clients trouvés dans la liste.`);
  console.log('🔄 Maintenant, ouvrez chaque client pour voir ses bateaux...');
  console.log('📋 Pour scraper les bateaux, cliquez sur le bouton vert (éditer) de chaque client');
  console.log('   et exécutez ce script dans la modale ouverte :');
  console.log('');
  console.log('--- SCRIPT BATEAUX (à exécuter quand la modale est ouverte) ---');
  console.log(`
    (function() {
      const bateauxRows = document.querySelectorAll('.p-dialog table tbody tr, .p-dialog .p-datatable-tbody tr');
      const bateaux = [];
      bateauxRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const nom = cells[0]?.textContent?.trim();
          const type = cells[1]?.textContent?.trim();
          const agrement = cells[2]?.textContent?.trim() || '';
          if (nom) bateaux.push({ nom, type, agrement });
        }
      });
      console.log('Bateaux:', JSON.stringify(bateaux));
    })();
  `);
  
  // Copy main list to clipboard
  const json = JSON.stringify(clients, null, 2);
  try {
    await navigator.clipboard.writeText(json);
    console.log('📋 Liste clients copiée dans le presse-papiers !');
  } catch(e) {
    console.log('⚠️ Copie auto échouée. Copiez manuellement ci-dessous :');
  }
  console.log(json);
  
  return clients;
})();
