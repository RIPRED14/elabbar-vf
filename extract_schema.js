const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

// Find the start of defaults:
const startIndex = content.indexOf('defaults: {');
if (startIndex === -1) {
  console.log('defaults not found');
  process.exit(1);
}

// Simple brace matching to extract the object
let openBraces = 0;
let endIndex = -1;
for (let i = startIndex + 10; i < content.length; i++) {
  if (content[i] === '{') openBraces++;
  else if (content[i] === '}') {
    openBraces--;
    if (openBraces === 0) {
      endIndex = i;
      break;
    }
  }
}

if (endIndex === -1) {
  console.log('defaults end not found');
  process.exit(1);
}

let defaultsStr = content.substring(startIndex + 10, endIndex + 1);
// It's not pure JSON, it's a JS object literal. We can evaluate it by wrapping it in parens.
try {
  const defaults = eval('(' + defaultsStr + ')');
  const schemas = {};
  for (const key of Object.keys(defaults)) {
    if (Array.isArray(defaults[key]) && defaults[key].length > 0) {
      schemas[key] = Object.keys(defaults[key][0]);
    } else if (key === 'pointage') {
        schemas[key] = ['date', 'employee_id', 'hours'];
    }
  }
  console.log(JSON.stringify(schemas, null, 2));
} catch(e) {
  console.log('Eval error', e.message);
}
