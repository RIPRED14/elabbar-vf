async function probe() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  const tables = ['sortiesstockage', 'mouvementsstock', 'production'];
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
      console.log(`\n=== Table: ${table} ===`);
      console.log("Status:", res.status);
      console.log("Details:", text);
    } catch (e) {
      console.error(`Error on table ${table}:`, e);
    }
  }
}
probe();
