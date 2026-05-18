const fs = require('fs');

try {
  const dump = JSON.parse(fs.readFileSync('scratch/database_dump.json', 'utf8'));
  console.log("Dump top-level keys:", Object.keys(dump));
  
  if (dump.stockage) {
    console.log("Stockage items count in dump:", dump.stockage.length);
    if (dump.stockage.length > 0) {
      console.log("First stockage item in dump:", JSON.stringify(dump.stockage[0], null, 2));
    }
  }
  
  if (dump.clients) {
    console.log("Clients items count in dump:", dump.clients.length);
    if (dump.clients.length > 0) {
      console.log("First client item in dump:", JSON.stringify(dump.clients[0], null, 2));
    }
  }

  if (dump.consommables) {
    console.log("Consommables items count in dump:", dump.consommables.length);
    if (dump.consommables.length > 0) {
      console.log("First consommable item in dump:", JSON.stringify(dump.consommables[0], null, 2));
    }
  }
} catch (e) {
  console.error("Error:", e);
}
