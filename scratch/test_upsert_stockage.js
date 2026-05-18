async function test() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  console.log("Testing stockage upsert via fetch...");
  const sampleStockage = {
    id: "test-stock-1",
    lot: "LOT-001",
    chambre: "CS 01",
    espece: "ANCHOIS",
    calibre: "1",
    poids: 100,
    nb_caisses: 10,
    date_entree: "2026-05-15",
    statut: "Refrigere",
    client: "Client A"
  };
  
  const res = await fetch(`${sbUrl}/rest/v1/stockage?on_conflict=id`, {
    method: 'POST',
    headers: {
      'apikey': sbKey,
      'Authorization': `Bearer ${sbKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(sampleStockage)
  });
  
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log("Response:", text);
}

test();
