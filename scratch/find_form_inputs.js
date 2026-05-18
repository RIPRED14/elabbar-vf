const fs = require('fs');

try {
  const html = fs.readFileSync('/Users/m/Downloads/ELABBAR-main 3/scratch/facture_page_longer.html', 'utf8');
  
  const target = 'Rechercher';
  const idx = html.indexOf(target);
  
  if (idx !== -1) {
    // Find the start of the form before the Rechercher button
    const formStart = html.lastIndexOf('<form', idx);
    if (formStart !== -1) {
      console.log(`Found <form at index ${formStart}. Printing form structure up to Rechercher:`);
      console.log(html.substring(formStart, idx + 300));
    } else {
      console.log("No <form tag found before Rechercher button. Printing 8000 chars before button:");
      const start = Math.max(0, idx - 8000);
      console.log(html.substring(start, idx + 300));
    }
  } else {
    console.log("Rechercher not found.");
  }
} catch (e) {
  console.error("Failed:", e);
}
