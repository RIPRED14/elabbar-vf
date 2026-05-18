const fs = require('fs');
const dump = JSON.parse(fs.readFileSync('scratch/database_dump.json', 'utf8'));

console.log("Dump root keys:", Object.keys(dump));
for (const key in dump) {
  if (Array.isArray(dump[key])) {
    console.log(`- ${key}: ${dump[key].length} items`);
    if (dump[key].length > 0) {
      console.log(`  Sample item keys:`, Object.keys(dump[key][0]));
      console.log(`  Sample item details:`, JSON.stringify(dump[key][0], null, 2).substring(0, 500));
    }
  } else {
    console.log(`- ${key}:`, typeof dump[key]);
  }
}
