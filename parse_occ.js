const XLSX = require('/tmp/parse_excel/node_modules/xlsx');
const wb = XLSX.readFile('H POINTAGE MARS.xlsx');
const occasionnels = new Set();
for (const sheetName of wb.SheetNames) {
    if (sheetName.includes('QUINZ')) {
        const sheet = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, {header: 1});
        for (let i = 0; i < data.length; i++) {
            const name = data[i][0];
            if (name && typeof name === 'string' && name !== 'NOM ET PRENOM' && name !== 'total' && name !== 'POINTAGE 2EME QUINZAINE MARS') {
                occasionnels.add(name.trim());
            }
        }
    }
}
let id = 27;
for (const name of Array.from(occasionnels)) {
    console.log(`      { id: ${id++}, nom: '${name}', prenom: '', type: 'occasionnel', poste: 'Ouvrier', dept: 'Production', salaire: 0, actif: true },`);
}
