async function test() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  const tables = ['settings', 'personnel', 'production', 'pointage', 'stockage', 'factures', 'clients', 'consommables', 'sortiesstockage', 'mouvementsstock', 'qrcodes'];
  
  console.log("Fetching one record from each table to inspect actual Postgres column names...");
  
  for (const table of tables) {
    try {
      const res = await fetch(`${sbUrl}/rest/v1/${table}?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log(`\nTable: "${table}" - Row count/sample returned: ${data.length}`);
        if (data.length > 0) {
          console.log("Keys:", Object.keys(data[0]));
          console.log("Sample:", data[0]);
        }
      } else {
        console.log(`\nTable: "${table}" - Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log("Error body:", text);
      }
    } catch (e) {
      console.error(`Error querying "${table}":`, e.message);
    }
  }
}

test();
