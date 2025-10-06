import fetch from 'node-fetch';

const API_KEY = 'AIzaSyBCKLMQJVqZHCORpRniGVLthmdwUf2bDXk';
const SPREADSHEET_ID = '1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk';

// Get spreadsheet metadata
const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`;
console.log('Fetching spreadsheet metadata...\n');

const response = await fetch(metadataUrl);
const data = await response.json();

if (data.error) {
  console.error('Error:', data.error);
  process.exit(1);
}

console.log('Spreadsheet title:', data.properties.title);
console.log('\nFirst 10 sheets:');
data.sheets.slice(0, 10).forEach((sheet, i) => {
  console.log(`${i + 1}. ${sheet.properties.title} (${sheet.properties.gridProperties.rowCount} rows, ${sheet.properties.gridProperties.columnCount} cols)`);
});

// Try fetching first sheet
const firstSheetName = data.sheets[0].properties.title;
console.log(`\nFetching data from first sheet: ${firstSheetName}`);

const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(firstSheetName)}!A:Z?key=${API_KEY}`;
const sheetResponse = await fetch(sheetUrl);
const sheetData = await sheetResponse.json();

if (sheetData.error) {
  console.error('Error:', sheetData.error);
} else {
  console.log(`Rows fetched: ${sheetData.values ? sheetData.values.length : 0}`);
  if (sheetData.values && sheetData.values.length > 0) {
    console.log('\nHeaders:', sheetData.values[0]);
    console.log('First data row:', sheetData.values[1]);
  }
}
