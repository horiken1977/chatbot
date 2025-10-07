import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

async function checkSheetStructure() {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const spreadsheetId = '1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk';
  const sheetName = 'M6CH01001';

  // 最初の10行を取得
  const range = `${encodeURIComponent(sheetName)}!A1:Z10`;
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}?key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  console.log('=== M6CH01001シートの構造（最初の10行） ===\n');

  if (data.values) {
    data.values.forEach((row: string[], index: number) => {
      console.log(`\n行${index + 1}:`);
      row.forEach((cell, colIndex) => {
        const colName = String.fromCharCode(65 + colIndex); // A, B, C...
        if (cell) {
          const preview = cell.length > 80 ? cell.substring(0, 80) + '...' : cell;
          console.log(`  ${colName}列: ${preview}`);
        }
      });
    });
  }

  // E列とF列の内容を詳しく確認（6行目以降）
  const dataRange = `${encodeURIComponent(sheetName)}!E6:F15`;
  const dataUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/${dataRange}?key=${apiKey}`;

  const dataResponse = await fetch(dataUrl);
  const dataResult = await dataResponse.json();

  console.log('\n\n=== E列とF列の内容（6行目〜15行目） ===\n');

  if (dataResult.values) {
    dataResult.values.forEach((row: string[], index: number) => {
      const rowNum = index + 6;
      console.log(`\n--- 行${rowNum} ---`);
      if (row[0]) {
        console.log(`E列: ${row[0].substring(0, 150)}...`);
      }
      if (row[1]) {
        console.log(`F列: ${row[1].substring(0, 150)}...`);
      }
    });
  }
}

checkSheetStructure().catch(console.error);
