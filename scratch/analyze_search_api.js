const fs = require('fs');

try {
  const reqs = JSON.parse(fs.readFileSync('/Users/m/Downloads/ELABBAR-main 3/scratch/factures_search_network.json', 'utf8'));
  console.log(`Analyzing ${reqs.length} search API/XHR/Fetch responses:`);
  reqs.forEach((r, idx) => {
    if (r.url.includes('ntsamak-api.ntwtec.com')) {
      console.log(`\n[${idx}] ${r.method} ${r.url} -> Status ${r.status}`);
      if (r.postData) {
        console.log(`    Post Data: ${r.postData}`);
      }
      if (r.responseLength) {
        console.log(`    Response length: ${r.responseLength}`);
        console.log(`    Response sample: ${r.responseSample}`);
      }
    }
  });
} catch (e) {
  console.error("Analysis failed:", e);
}
