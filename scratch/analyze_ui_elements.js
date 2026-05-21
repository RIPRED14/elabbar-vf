const fs = require('fs');

try {
  const html = fs.readFileSync('scratch/facture_page_longer.html', 'utf8');

  console.log("=== Matches for Table Headers ===");
  const thRegex = /<th([^>]*)>([\s\S]*?)<\/th>/gi;
  let match;
  let i = 0;
  while ((match = thRegex.exec(html)) !== null) {
    const attrs = match[1].replace(/\s+/g, ' ').trim();
    const content = match[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    console.log(`[TH ${i++}] Attrs: "${attrs}" | Text: "${content}"`);
  }

  console.log("\n=== Matches for Table Data Columns ===");
  // Let's find tr template and fields mapped (Primeng p-dataTable template fields)
  const tdRegex = /\{\{\s*facture\.\w+\s*\}\}/gi;
  const matches = html.match(/\{\{[\s\S]*?\}\}/g);
  if (matches) {
    console.log("Unique curly expressions in table:", Array.from(new Set(matches)));
  }

} catch (e) {
  console.error("Analysis failed:", e);
}
