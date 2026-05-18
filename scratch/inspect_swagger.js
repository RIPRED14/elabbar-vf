const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';

async function inspect() {
  console.log("Fetching OpenAPI spec...");
  const res = await fetch(`${sbUrl}/rest/v1`, {
    headers: {
      'apikey': sbKey
    }
  });
  
  console.log("Response status:", res.status);
  const text = await res.text();
  if (res.ok) {
    const data = JSON.parse(text);
    if (data.definitions && data.definitions.factures) {
      console.log("Columns in 'factures':", Object.keys(data.definitions.factures.properties));
    } else {
      console.log("Factures definition not found. Available definitions:", Object.keys(data.definitions || {}));
    }
  } else {
    console.log("Error response:", text);
  }
}

inspect().catch(console.error);
