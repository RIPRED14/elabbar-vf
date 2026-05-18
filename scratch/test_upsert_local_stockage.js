async function test() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  console.log("Testing local stockage upsert via fetch...");
  const localStockage = {
    id: "test-doc-1",
    reference: "REF-001",
    dateEntree: "2026-05-15",
    client: "Sea Pesca",
    fournisseur: "Bateau A",
    bateau: "Bateau A",
    consignataire: "Cons A",
    vehicule: "VEH-1",
    refCapture: "CAPT-1",
    sejour: "Transit",
    dateSortie: "",
    origine: "Maroc",
    tarePaletteDefaut: 25,
    lignes: [
      {
        palette: "P1",
        espece: "ANCHOIS",
        calibre: "1",
        quantite: 100,
        nbCaisses: 10,
        chambre: "CS 01",
        qualite: "A"
      }
    ]
  };
  
  const res = await fetch(`${sbUrl}/rest/v1/stockage?on_conflict=id`, {
    method: 'POST',
    headers: {
      'apikey': sbKey,
      'Authorization': `Bearer ${sbKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(localStockage)
  });
  
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log("Response:", text);
}

test();
