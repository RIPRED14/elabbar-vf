const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';

async function inspect() {
  console.log("Fetching OpenAPI spec...");
  const res = await fetch(`${sbUrl}/rest/v1`, {
    headers: {
      'apikey': sbKey
    }
  });
  
  if (res.ok) {
    const data = JSON.parse(await res.text());
    console.log("=== Available Tables in Supabase ===");
    const tables = Object.keys(data.definitions || {});
    console.log(tables.join(", "));
    
    for (const table of tables) {
      console.log(`\nTable: "${table}"`);
      const properties = data.definitions[table].properties || {};
      console.log("Columns:", Object.keys(properties).join(", "));
    }
  } else {
    console.log("Error response:", await res.text());
  }
}

inspect().catch(console.error);
