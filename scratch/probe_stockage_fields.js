async function probeStockage() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  try {
    const res = await fetch(`${sbUrl}/rest/v1/stockage?select=*`, {
      method: 'GET',
      headers: {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`
      }
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Stockage records found:", data.length);
    if (data.length > 0) {
      console.log("First record keys:", Object.keys(data[0]));
      console.log("First record details:", JSON.stringify(data[0], null, 2));
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

probeStockage();
