const XLSX = require('/tmp/parse_excel/node_modules/xlsx');
const wb = XLSX.readFile('H POINTAGE MARS.xlsx');
const sheet = wb.Sheets['ouvrier fixe'];
const data = XLSX.utils.sheet_to_json(sheet, {header: 1});
for (let i = 0; i < data.length; i++) {
    if (data[i][0] && typeof data[i][0] === 'string') {
        console.log(data[i][0], "---", data[i][1]);
    }
}
