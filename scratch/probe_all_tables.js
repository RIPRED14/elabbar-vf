async function probeAll() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  const tables = ['settings', 'personnel', 'production', 'pointage', 'stockage', 'factures', 'clients', 'consommables', 'sortiesstockage', 'mouvementsstock', 'qrcodes', 'especes', 'fiches_pointage'];
  
  for (const t of tables) {
    try {
      const res = await fetch(`${sbUrl}/rest/v1/${t}?select=*&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`
        }
      });
      
      console.log(`\n=============================`);
      console.log(`Table: ${t}`);
      console.log(`Status: ${res.status}`);
      if (res.status === 200) {
        const data = await res.json();
        console.log(`Records count returned: ${data.length}`);
        if (data.length > 0) {
          console.log("Keys:", Object.keys(data[0]));
          console.log("Sample record:", JSON.stringify(data[0], null, 2));
        } else {
          console.log("No records in table");
        }
      } else {
        const errText = await res.text();
        console.log("Error:", errText);
      }
    } catch (e) {
      console.error(`Error fetching table ${t}:`, e);
    }
  }
}

probeAll();
