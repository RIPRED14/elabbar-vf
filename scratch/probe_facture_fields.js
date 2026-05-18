async function test() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  const columnsToTest = [
    'id', 'reference', 'fournisseur', 'date', 'tva', 'devise', 'motif',
    'numero', 'valide', 'type', 'origine', 'dateecheance', 'montantht',
    'montantttc', 'lignes', 'allocation', 'societe', 'status', 'remise',
    'reglement', 'taux', 'created_at', 'updated_at', 'fournisseur_id',
    'societe_id', 'etat_paiement', 'etatpaiement', 'etat'
  ];
  
  console.log("Probing columns for 'factures' table in Supabase...");
  
  for (const col of columnsToTest) {
    try {
      const res = await fetch(`${sbUrl}/rest/v1/factures`, {
        method: 'POST',
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: 'probe_temp_id_999',
          [col]: "probe"
        })
      });
      
      const text = await res.text();
      if (res.status === 400) {
        if (text.includes("Could not find the")) {
          console.log(`❌ Column: "${col}" - DOES NOT EXIST`);
        } else {
          console.log(`✅ Column: "${col}" - EXISTS! (status 400, but not a column mismatch)`);
        }
      } else if (res.status === 201) {
        console.log(`✅ Column: "${col}" - EXISTS! (inserted successfully)`);
        // Clean up
        await fetch(`${sbUrl}/rest/v1/factures?id=eq.probe_temp_id_999`, {
          method: 'DELETE',
          headers: {
            'apikey': sbKey,
            'Authorization': `Bearer ${sbKey}`
          }
        });
      } else {
        console.log(`❓ Column: "${col}" - Status ${res.status}: ${text}`);
      }
    } catch (e) {
      console.error(`Error table:`, e);
    }
  }
}

test();
