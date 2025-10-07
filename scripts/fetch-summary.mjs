import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

async function fetchSummary(spreadsheetId, sheetName, category) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const RANGE = `${sheetName}!E:E`;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: RANGE,
    });

    const rows = response.data.values || [];
    console.log(`\n=== ${category} - E列（要約の重要ポイント）===`);
    console.log(`取得した行数: ${rows.length}\n`);

    rows.forEach((row, index) => {
      if (row[0] && row[0].trim() && index > 0) {
        console.log(`${index}. ${row[0]}`);
        console.log('');
      }
    });
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

// BtoC
await fetchSummary('1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk', '要約', 'BtoC');

// BtoB
await fetchSummary('1iak9tO-bX93xqMDds2Ap6dxsRR_rr7grBeajLXH1rso', '要約', 'BtoB');
