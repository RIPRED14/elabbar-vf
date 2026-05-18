async function test() {
  const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
  const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';
  
  // Let's query information_schema.columns via POST to the rpc or a direct query using the rest api if permitted.
  // PostgREST allows querying views/tables, let's see if we can get it or if we can run an RPC.
  // Wait, let's fetch schemas using the Rest interface.
  // In PostgREST, we can get openapi description by GETing the root URL!
  // That gives the complete database schema with tables and columns!
  
  console.log("Fetching OpenAPI spec from PostgREST to inspect all tables and columns...");
  const res = await fetch(`${sbUrl}/rest/v1/`, {
    method: 'GET',
    headers: {
      'apikey': sbKey,
      'Authorization': `Bearer ${sbKey}`
    }
  });
  
  if (res.ok) {
    const spec = await res.json();
    console.log("Tables found in OpenAPI spec:", Object.keys(spec.paths));
    
    // Let's print columns for each table we are interested in.
    const tablesOfInterest = ['settings', 'personnel', 'production', 'pointage', 'stockage', 'factures', 'clients', 'consommables', 'sortiesstockage', 'mouvementsstock', 'qrcodes'];
    
    for (const t of tablesOfInterest) {
      const path = `/rest/v1/${t}`;
      const pathSpec = spec.paths[path];
      if (pathSpec) {
        console.log(`\n==================================================`);
        console.log(`TABLE: ${t}`);
        console.log(`==================================================`);
        
        // Post/Get parameters usually list fields
        const getOp = pathSpec.get;
        if (getOp && getOp.parameters) {
          const queryParams = getOp.parameters.filter(p => p.in === 'query');
          console.log("Columns:");
          queryParams.forEach(p => {
            if (!p.name.includes('.')) {
              console.log(`  - ${p.name} (${p.type || p.schema?.type || 'unknown'})`);
            }
          });
        }
      } else {
        console.log(`\nTable path "${path}" not found in OpenAPI spec.`);
      }
    }
  } else {
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log("Error body:", text);
  }
}

test();
