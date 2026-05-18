async function testAll() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  const tables = [
    'personnel', 
    'production', 
    'stockage', 
    'factures', 
    'clients', 
    'consommables', 
    'sortiesstockage', 
    'mouvementsstock', 
    'qrcodes', 
    'especes', 
    'fiches_pointage'
  ];
  
  console.log("Testing querying all lowercase table names from Supabase...");
  
  for (const table of tables) {
    try {
      const res = await fetch(`${sbUrl}/rest/v1/${table}?select=*`, {
        method: 'GET',
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`
        }
      });
      
      console.log(`Table: "${table}" - Status: ${res.status}`);
    } catch (e) {
      console.error(`Error querying "${table}":`, e.message);
    }
  }
}

testAll();
