const fs = require('fs');
const path = require('path');

try {
  const html = fs.readFileSync('/Users/m/Downloads/ELABBAR-main 3/scratch/facture_page_longer.html', 'utf8');

  console.log("=== Matches for Buttons ===");
  const buttonRegex = /<button([^>]*)>([\s\S]*?)<\/button>/gi;
  let match;
  let i = 0;
  while ((match = buttonRegex.exec(html)) !== null) {
    const attrs = match[1].replace(/\s+/g, ' ').trim();
    const content = match[2].replace(/\s+/g, ' ').trim();
    console.log(`[Button ${i++}] Attrs: "${attrs}" | Text: "${content}"`);
  }

  console.log("\n=== Matches for Inputs ===");
  const inputRegex = /<input([^>]*)\/?>/gi;
  let j = 0;
  while ((match = inputRegex.exec(html)) !== null) {
    const attrs = match[1].replace(/\s+/g, ' ').trim();
    console.log(`[Input ${j++}] Attrs: "${attrs}"`);
  }

  console.log("\n=== Matches for Dropdowns ===");
  const dropdownRegex = /<p-dropdown([^>]*)>([\s\S]*?)<\/p-dropdown>/gi;
  let k = 0;
  while ((match = dropdownRegex.exec(html)) !== null) {
    const attrs = match[1].replace(/\s+/g, ' ').trim();
    const content = match[2].replace(/\s+/g, ' ').trim().substring(0, 100);
    console.log(`[Dropdown ${k++}] Attrs: "${attrs}" | Text Sample: "${content}"`);
  }

} catch (e) {
  console.error("Analysis failed:", e);
}
