const xlsx = require('xlsx');

const files = [
  'd:\\AI\\fcps\\FCPS_MCQs_5000_Batch.xlsx',
  'd:\\AI\\fcps\\FCPS_MCQs_Batch1_1000.xlsx',
  'd:\\AI\\fcps\\FCPS_MCQs_Batch1_2000.xlsx'
];

for (const file of files) {
  try {
    const workbook = xlsx.readFile(file);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- File: ${file} ---`);
    console.log(`Headers:`, data[0]);
    console.log(`Row 1:`, data[1]);
    console.log(`Total Rows:`, data.length - 1);
  } catch (error) {
    console.error(`Error reading ${file}:`, error.message);
  }
}
