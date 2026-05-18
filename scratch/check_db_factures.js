async function test() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  console.log("Fetching a few records from 'factures' table in Supabase...");
  try {
    const res = await fetch(`${sbUrl}/rest/v1/factures?limit=3`, {
      method: 'GET',
      headers: {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Records found:");
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
