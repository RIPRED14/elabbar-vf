const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

const regex = /App\.data\.production\.push\(\s*({[\s\S]+?})\s*\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log("Found production.push in app.js:", match[1]);
}

const contentSaisie = fs.readFileSync('modules/saisie.js', 'utf8');
const regexSaisie = /App\.data\.production\.push\(\s*({[\s\S]+?})\s*\)/g;
let matchSaisie;
while ((matchSaisie = regexSaisie.exec(contentSaisie)) !== null) {
  console.log("Found production.push in saisie.js:", matchSaisie[1].substring(0, 500));
}

