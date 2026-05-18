async function inspectTable(tableName) {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';

  console.log(`\n--- Inspecting Table: ${tableName} ---`);
  
  // 1. Try GET with limit 1
  try {
    const res = await fetch(`${sbUrl}/rest/v1/${tableName}?limit=1`, {
      headers: {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`
      }
    });
    console.log(`GET Status: ${res.status}`);
    const data = await res.json();
    console.log("First row:", data);
  } catch (err) {
    console.error(`Error fetching ${tableName}:`, err.message);
  }

  // 2. Try OPTIONS
  try {
    const res = await fetch(`${sbUrl}/rest/v1/${tableName}`, {
      method: 'OPTIONS',
      headers: {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`
      }
    });
    console.log(`OPTIONS Status: ${res.status}`);
    if (res.status === 200) {
      const text = await res.text();
      console.log("OPTIONS response preview (first 500 chars):", text.slice(0, 500));
    }
  } catch (err) {
    console.error(`Error OPTIONS on ${tableName}:`, err.message);
  }
}

async function main() {
  const tables = ['stockage', 'sortiesstockage', 'production', 'mouvementsstock', 'personnel', 'factures', 'clients', 'consommables'];
  for (const table of tables) {
    await inspectTable(table);
  }
}

main();
