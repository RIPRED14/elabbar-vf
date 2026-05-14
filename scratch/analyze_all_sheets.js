const XLSX = require('xlsx');
const workbook = XLSX.readFile('/Users/m/Downloads/ELABBAR-main 3/H POINTAGE MARS.xlsx');
console.log('Sheets:', workbook.SheetNames);
workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`--- Sheet: ${name} (Rows: ${data.length}) ---`);
    if (data.length > 0) console.log(JSON.stringify(data[0]));
    if (data.length > 1) console.log(JSON.stringify(data[1]));
});
