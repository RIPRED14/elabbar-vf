async function probe() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  const tables = ['sortiesStockage', 'production'];
  for (const table of tables) {
    try {
      const res = await fetch(`${sbUrl}/rest/v1/${table}?select=*&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`
        }
      });
      const data = await res.json();
      console.log(`\n=== Table: ${table} ===`);
      console.log("Status:", res.status);
      console.log("Records count:", data.length);
      if (data.length > 0) {
        console.log("First record keys:", Object.keys(data[0]));
        console.log("First record details:", JSON.stringify(data[0], null, 2));
      } else {
        console.log("No records found.");
      }
    } catch (e) {
      console.error(`Error on table ${table}:`, e);
    }
  }
}
probe();
