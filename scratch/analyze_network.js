const fs = require('fs');

try {
  const reqs = JSON.parse(fs.readFileSync('/Users/m/Downloads/ELABBAR-main 3/scratch/factures_network.json', 'utf8'));
  console.log(`Analyzed ${reqs.length} intercepted requests:`);
  reqs.forEach((r, idx) => {
    console.log(`[${idx}] ${r.method} ${r.url} -> Status ${r.status}`);
    if (r.responseLength) {
      console.log(`    Response length: ${r.responseLength}`);
      console.log(`    Sample: ${r.responseSample}`);
    }
    if (r.error) {
      console.log(`    Error: ${r.error}`);
    }
  });
} catch (e) {
  console.error("Analysis failed:", e);
}
