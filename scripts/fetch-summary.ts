import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.localを読み込む
config({ path: resolve(__dirname, '../.env.local') });

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

async function fetchSummary(spreadsheetId: string, category: string) {
  console.log(`\n=== ${category} - 要約の重要ポイント ===\n`);

  try {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_SHEETS_API_KEY not configured');
    }

    const sheetName = '要訳シート';
    const encodedSheetName = encodeURIComponent(sheetName);
    const range = `${encodedSheetName}!E:E`;
    const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}?key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const data = result.values || [];

    // E列の内容を抽出（最初の行はヘッダー）
    const points: string[] = [];
    data.forEach((row: string[], index: number) => {
      if (index > 0 && row[0]) { // ヘッダー行をスキップ
        const point = row[0].trim();
        if (point) {
          points.push(point);
        }
      }
    });

    console.log(`取得したポイント数: ${points.length}\n`);
    points.forEach((point, index) => {
      console.log(`${index + 1}. ${point}\n`);
    });

    return points;
  } catch (error) {
    console.error(`エラー (${category}):`, error);
    return [];
  }
}

async function main() {
  // BtoC
  const btocSpreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk';
  const btocPoints = await fetchSummary(btocSpreadsheetId, 'BtoC');

  // BtoB
  const btobSpreadsheetId = process.env.GOOGLE_SHEETS_BTOB_SPREADSHEET_ID || '1iak9tO-bX93xqMDds2Ap6dxsRR_rr7grBeajLXH1rso';
  const btobPoints = await fetchSummary(btobSpreadsheetId, 'BtoB');

  console.log('\n=== サマリー ===');
  console.log(`BtoC: ${btocPoints.length}ポイント`);
  console.log(`BtoB: ${btobPoints.length}ポイント`);
}

main();
