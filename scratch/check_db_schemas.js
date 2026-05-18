async function inspect() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  const tables = [
    'stockage', 
    'sortiesstockage',
    'production'
  ];
  
  for (const table of tables) {
    console.log(`\n=================== Inspecting Table: ${table} ===================`);
    try {
      const res = await fetch(`${sbUrl}/rest/v1/${table}?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`,
          'Prefer': 'return=representation'
        }
      });
      
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Row count: ${data.length}`);
        if (data.length > 0) {
          console.log("Keys and sample values:");
          console.log(JSON.stringify(data[0], null, 2));
        } else {
          console.log("Table is empty. Let's see if we can get the columns via openapi or another query.");
        }
      } else {
        console.log(await res.text());
      }
    } catch (e) {
      console.error(e);
    }
  }
}

inspect();
