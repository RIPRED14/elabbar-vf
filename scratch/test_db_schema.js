const fs = require('fs');

async function check() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  console.log("Fetching Supabase PostgREST OpenAPI spec...");
  const res = await fetch(`${sbUrl}/rest/v1/`, {
    headers: {
      'apikey': sbKey,
      'Authorization': `Bearer ${sbKey}`
    }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch schema: ${res.statusText}`);
  }
  
  const swagger = await res.json();
  const facturesDef = swagger.definitions.factures;
  if (!facturesDef) {
    console.log("factures table definition not found!");
  } else {
    console.log("Columns in 'factures' table:", Object.keys(facturesDef.properties));
    console.log("Full properties definition:", JSON.stringify(facturesDef.properties, null, 2));
  }
}

check().catch(console.error);
