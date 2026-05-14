const XLSX = require('xlsx');
const workbook = XLSX.readFile('/Users/m/Downloads/ELABBAR-main 3/H POINTAGE MARS.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('--- FIRST 5 ROWS ---');
data.slice(0, 10).forEach(row => console.log(JSON.stringify(row)));
