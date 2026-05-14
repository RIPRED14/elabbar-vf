const XLSX = require('/tmp/parse_excel/node_modules/xlsx');
const wb = XLSX.readFile('H POINTAGE MARS.xlsx');
console.log(wb.SheetNames);
for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, {header: 1});
    console.log("=== " + sheetName + " ===");
    for(let i=0; i<Math.min(20, data.length); i++) {
        console.log(data[i].slice(0,3)); // first 3 columns
    }
}
