const SPREADSHEET_ID = '1iak9tO-bX93xqMDds2Ap6dxsRR_rr7grBeajLXH1rso';
const API_KEY = 'AIzaSyBCKLMQJVqZHCORpRniGVLthmdwUf2bDXk';

// Get all sheet names
const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`;

try {
  const response = await fetch(url);
  const data = await response.json();
  
  const sheets = data.sheets.map(s => s.properties.title);
  console.log('Total sheets:', sheets.length);
  console.log('\nFirst 10 sheets:', sheets.slice(0, 10));
  console.log('\nLast 10 sheets:', sheets.slice(-10));
  
  // Pattern analysis
  const btobSheets = sheets.filter(s => s.match(/^B6CH\d+/));
  console.log('\nBtoB sheets (B6CH...):', btobSheets.length);
  console.log('Range:', btobSheets[0], '~', btobSheets[btobSheets.length - 1]);
  
} catch (error) {
  console.error('Request failed:', error.message);
}
