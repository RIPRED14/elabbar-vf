async function test() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  const tables = [
    'settings', 
    'personnel', 
    'production', 
    'pointage', 
    'stockage', 
    'factures', 
    'clients', 
    'consommables', 
    'sortiesstockage', 
    'mouvementsstock', 
    'qrcodes', 
    'especes',
    'fiches_pointage',
    'fiches_pointages',
    'fiche_pointage',
    'espece'
  ];
  
  console.log("Probing columns for lowercase tables in Supabase...");
  
  for (const table of tables) {
    try {
      const res = await fetch(`${sbUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          nonexistent_column_probe_123: "probe"
        })
      });
      
      const text = await res.text();
      console.log(`Table: ${table} (status ${res.status})`);
      if (res.status === 400) {
        console.log(` -> EXISTS! Details: ${text.substring(0, 150)}`);
      } else {
        console.log(` -> DOES NOT EXIST: ${text.substring(0, 150)}`);
      }
    } catch (e) {
      console.error(`Error table ${table}:`, e);
    }
  }
}

test();
