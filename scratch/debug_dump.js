const fs = require('fs');

try {
  const db = JSON.parse(fs.readFileSync('/Users/m/Downloads/ELABBAR-main 3/scratch/database_dump.json', 'utf8'));
  console.log("Top-level keys (API paths) in database_dump.json:");
  Object.keys(db).forEach(k => {
    console.log(`- ${k} (${Array.isArray(db[k]) ? db[k].length : typeof db[k]} items)`);
    // Print a sample item if it is an array and has elements
    if (Array.isArray(db[k]) && db[k].length > 0) {
      console.log("  Sample item keys:", Object.keys(db[k][0]));
    }
  });
} catch (e) {
  console.error(e);
}
