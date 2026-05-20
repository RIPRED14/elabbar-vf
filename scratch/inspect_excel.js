const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const files = [
  'rapport_production.xlsx',
  'Rapport  Production 05-26.xlsx',
  'EXCEL_hamza.xlsx'
];

files.forEach(filename => {
  const filepath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filepath)) {
    console.log(`File not found: ${filename}`);
    return;
  }
  console.log(`\n=================== Inspecting ${filename} ===================`);
  const workbook = XLSX.readFile(filepath);
  console.log('Sheet Names:', workbook.SheetNames);
  
  // Inspect first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  console.log(`Sheet range: ${worksheet['!ref']}`);
  // Read first 15 rows
  const rows = [];
  for (let r = range.s.r; r <= Math.min(range.e.r, 15); r++) {
    const row = [];
    for (let c = range.s.c; c <= Math.min(range.e.c, 15); c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[addr];
      row.push(cell ? cell.v : null);
    }
    rows.push(row);
  }
  
  rows.forEach((r, idx) => {
    console.log(`Row ${idx}:`, r.map(v => v === null ? '' : String(v).trim()).join(' | '));
  });
});
