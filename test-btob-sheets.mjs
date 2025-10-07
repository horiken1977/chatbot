const SPREADSHEET_ID = '1iak9tO-bX93xqMDds2Ap6dxsRR_rr7grBeajLXH1rso';
const API_KEY = 'AIzaSyBCKLMQJVqZHCORpRniGVLthmdwUf2bDXk';

// Test first sheet
const sheetName = 'B6CH01000';
const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${API_KEY}`;

try {
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    console.error('Error:', data.error.message);
  } else {
    console.log('✅ Sheet found:', sheetName);
    console.log('Total rows:', data.values?.length || 0);
    console.log('\nFirst 10 rows:');
    data.values?.slice(0, 10).forEach((row, i) => {
      console.log(`Row ${i}:`, row.slice(0, 3));
    });
  }
} catch (error) {
  console.error('Request failed:', error.message);
}
