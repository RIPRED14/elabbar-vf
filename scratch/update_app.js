const fs = require('fs');

const db = JSON.parse(fs.readFileSync('database_dump.json'));

const clientsFrs = db['/clientFrs/byUserStes'] ? db['/clientFrs/byUserStes'][0] : [];
const especesData = db['/espece/byNtclientWithCalibresDes'] ? db['/espece/byNtclientWithCalibresDes'][0] : [];
const emballagesData = db['/emballage/byUserStes'] ? db['/emballage/byUserStes'][0] : [];

// Extract Clients and Fournisseurs
const clients = clientsFrs.filter(c => c.type && c.type.includes('C')).map(c => c.raisonSociale).filter(Boolean);
const fournisseurs = clientsFrs.filter(c => c.type && c.type.includes('F')).map(c => c.raisonSociale).filter(Boolean);

// Extract Especes
const especes = especesData.map(e => e.designation).filter(Boolean);

// Extract Calibres
const calibresSet = new Set();
especesData.forEach(e => {
    if (e.calibreDesignationList) {
        e.calibreDesignationList.split(',').forEach(c => calibresSet.add(c.trim()));
    }
});
const calibres = Array.from(calibresSet).filter(Boolean);

// Extract Emballages
const emballages = emballagesData.map(e => ({
    code: e.symbole || e.designation,
    designation: e.designation || e.symbole,
    tare: e.tarre || 1.0
})).filter(e => e.code);

// Read app.js
let appJs = fs.readFileSync('../app.js', 'utf8');

// Replace clients array
appJs = appJs.replace(/clients:\s*\[[\s\S]*?\],/m, `clients: ${JSON.stringify(clients)},`);

// Replace fournisseurs array
appJs = appJs.replace(/fournisseurs:\s*\[[\s\S]*?\],/m, `fournisseurs: ${JSON.stringify(fournisseurs)},`);

// Replace especes array
appJs = appJs.replace(/especes:\s*\[[\s\S]*?\],/m, `especes: ${JSON.stringify(especes)},`);

// Replace calibres array
appJs = appJs.replace(/calibres:\s*\[[\s\S]*?\],/m, `calibres: ${JSON.stringify(calibres)},`);

// Replace emballages array
appJs = appJs.replace(/emballages:\s*\[[\s\S]*?\],/m, `emballages: ${JSON.stringify(emballages, null, 6).replace(/\n/g, '\n    ')},`);

fs.writeFileSync('../app.js', appJs);
console.log(`Updated app.js with:\n- ${clients.length} Clients\n- ${fournisseurs.length} Fournisseurs\n- ${especes.length} Espèces\n- ${calibres.length} Calibres\n- ${emballages.length} Emballages`);
