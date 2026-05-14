const XLSX = require('/tmp/parse_excel/node_modules/xlsx');
const wb = XLSX.readFile('H POINTAGE MARS.xlsx');
for (const sheetName of wb.SheetNames) {
    console.log("=== Sheet:", sheetName, "===");
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, {header: 1});
    for (let i = 0; i < data.length; i++) {
        const row = data[i].filter(cell => cell !== null && cell !== undefined && cell !== '');
        if (row.length > 0) {
            console.log(JSON.stringify(row));
        }
    }
}
