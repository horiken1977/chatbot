import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

async function getSheetInfo(spreadsheetId: string, name: string) {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const url = `${SHEETS_API_BASE}/${spreadsheetId}?key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  console.log(`\n=== ${name} Spreadsheet Sheets ===`);
  if (data.sheets) {
    data.sheets.forEach((sheet: any) => {
      console.log(`- "${sheet.properties.title}" (ID: ${sheet.properties.sheetId})`);
    });
  }
}

async function main() {
  await getSheetInfo('1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk', 'BtoC');
  await getSheetInfo('1iak9tO-bX93xqMDds2Ap6dxsRR_rr7grBeajLXH1rso', 'BtoB');
}

main();
