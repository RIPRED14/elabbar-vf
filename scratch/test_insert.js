async function test() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  const testFacture = {
    id: "test_temp_id_123",
    numero: "TEST-01",
    date: "2026-05-15",
    fournisseur: "TEST FOURNISSEUR",
    montantht: 1000,
    tva: 200,
    montantttc: 1200,
    devise: "MAD",
    motif: "Test insertion",
    lignes: [{ description: "test article", quantite: 1, prixUnitaire: 1000, totalLigne: 1000 }]
  };

  console.log("Attempting test insertion into 'factures' table...");
  const res = await fetch(`${sbUrl}/rest/v1/factures`, {
    method: 'POST',
    headers: {
      'apikey': sbKey,
      'Authorization': `Bearer ${sbKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(testFacture)
  });

  const text = await res.text();
  console.log(`Response Status: ${res.status}`);
  console.log(`Response Body: ${text}`);

  // Clean up if it succeeded
  if (res.ok) {
    console.log("Success! Cleaning up test record...");
    await fetch(`${sbUrl}/rest/v1/factures?id=eq.test_temp_id_123`, {
      method: 'DELETE',
      headers: {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`
      }
    });
    console.log("Cleanup complete.");
  }
}

test().catch(console.error);
