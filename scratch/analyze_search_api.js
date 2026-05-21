const fs = require('fs');

try {
  const content = fs.readFileSync('scratch/factures_search_network.json', 'utf8');
  const entries = JSON.parse(content);
  
  const postEntry = entries.find(e => e.url && e.url.includes('factureFrs/byFilter') && e.method === 'POST');
  if (postEntry && postEntry.fullResponse) {
    const invoices = postEntry.fullResponse;
    console.log(`Found ${invoices.length} invoices in fullResponse.`);
    
    // Find all unique fields in invoices
    const fields = new Set();
    invoices.forEach(inv => {
      Object.keys(inv).forEach(k => fields.add(k));
    });
    console.log("All fields in invoice:", Array.from(fields));
    
    // Look for sub-objects / arrays that contain line items
    // Let's inspect: do any invoices have factureFrsDetails, factureFrsLists, factureFrsTraitementLists?
    let detailsSample = null;
    let listsSample = null;
    let traitementSample = null;
    
    for (const inv of invoices) {
      if (inv.factureFrsDetails && inv.factureFrsDetails.length > 0) {
        detailsSample = inv.factureFrsDetails;
      }
      if (inv.factureFrsLists && inv.factureFrsLists.length > 0) {
        listsSample = inv.factureFrsLists;
      }
      if (inv.factureFrsTraitementLists && inv.factureFrsTraitementLists.length > 0) {
        traitementSample = inv.factureFrsTraitementLists;
      }
    }
    
    console.log("\n--- factureFrsDetails Sample ---");
    console.log(detailsSample ? JSON.stringify(detailsSample.slice(0, 2), null, 2) : "None found");
    
    console.log("\n--- factureFrsLists Sample ---");
    console.log(listsSample ? JSON.stringify(listsSample.slice(0, 2), null, 2) : "None found");
    
    console.log("\n--- factureFrsTraitementLists Sample ---");
    console.log(traitementSample ? JSON.stringify(traitementSample.slice(0, 2), null, 2) : "None found");

    // Let's find an invoice with actual non-null values in these lists
    const nonTrivial = invoices.filter(inv => 
      (inv.factureFrsDetails && inv.factureFrsDetails.length > 0) ||
      (inv.factureFrsLists && inv.factureFrsLists.length > 0) ||
      (inv.factureFrsTraitementLists && inv.factureFrsTraitementLists.length > 0)
    );
    console.log(`\nInvoices with lists: ${nonTrivial.length}`);
    if (nonTrivial.length > 0) {
      console.log("Sample non-trivial invoice id:", nonTrivial[0].id);
      console.log("factureFrsLists:", JSON.stringify(nonTrivial[0].factureFrsLists, null, 2));
      console.log("factureFrsDetails:", JSON.stringify(nonTrivial[0].factureFrsDetails, null, 2));
      console.log("factureFrsTraitementLists:", JSON.stringify(nonTrivial[0].factureFrsTraitementLists, null, 2));
    }

  } else {
    console.log("No fullResponse found.");
  }
} catch (e) {
  console.error("Error:", e);
}
