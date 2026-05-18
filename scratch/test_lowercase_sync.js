async function test() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  const tables = ['sortiesstockage', 'mouvementsstock', 'qrcodes'];
  
  console.log("Testing querying lowercase table names from Supabase...");
  
  for (const table of tables) {
    try {
      const res = await fetch(`${sbUrl}/rest/v1/${table}?select=*`, {
        method: 'GET',
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`
        }
      });
      
      const text = await res.text();
      console.log(`\nTable: "${table}" - Status: ${res.status}`);
      console.log("Response:", text.substring(0, 200));
    } catch (e) {
      console.error(`Error querying "${table}":`, e.message);
    }
  }
}

test();
