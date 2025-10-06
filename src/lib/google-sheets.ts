/**
 * Google Sheets APIクライアント
 *
 * スプレッドシートからデータを取得
 */

import { env } from './env';
import type { SheetRow } from './chunker';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Google Sheets APIエラー
 */
export class GoogleSheetsError extends Error {
  constructor(
    message: string,
    public status?: number,
    public sheetName?: string
  ) {
    super(message);
    this.name = 'GoogleSheetsError';
  }
}

/**
 * APIレスポンスの型
 */
interface SheetsApiResponse {
  values?: string[][];
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * シート名の一覧を取得
 *
 * @returns シート名の配列
 */
export async function getSheetNames(): Promise<string[]> {
  const apiKey = env.googleSheetsApiKey;
  const spreadsheetId = env.googleSheetsSpreadsheetId;

  if (!apiKey || !spreadsheetId) {
    throw new GoogleSheetsError('Google Sheets API credentials not configured');
  }

  const url = `${SHEETS_API_BASE}/${spreadsheetId}?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new GoogleSheetsError(data.error.message, data.error.code);
    }

    if (!data.sheets || !Array.isArray(data.sheets)) {
      throw new GoogleSheetsError('Invalid spreadsheet structure');
    }

    return data.sheets.map((sheet: { properties: { title: string } }) => sheet.properties.title);
  } catch (error) {
    if (error instanceof GoogleSheetsError) {
      throw error;
    }
    throw new GoogleSheetsError(`Failed to fetch sheet names: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 特定のシートからデータを取得
 *
 * @param sheetName - シート名
 * @returns SheetRowの配列
 */
export async function getSheetData(sheetName: string): Promise<SheetRow[]> {
  const apiKey = env.googleSheetsApiKey;
  const spreadsheetId = env.googleSheetsSpreadsheetId;

  if (!apiKey || !spreadsheetId) {
    throw new GoogleSheetsError('Google Sheets API credentials not configured', undefined, sheetName);
  }

  // シート名にスペースや特殊文字がある場合はエンコード
  const encodedSheetName = encodeURIComponent(sheetName);
  const range = `${encodedSheetName}!A:Z`; // A列からZ列まで取得

  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}?key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new GoogleSheetsError(`HTTP ${response.status}: ${response.statusText}`, response.status, sheetName);
    }

    const data: SheetsApiResponse = await response.json();

    if (data.error) {
      throw new GoogleSheetsError(data.error.message, data.error.code, sheetName);
    }

    if (!data.values || !Array.isArray(data.values)) {
      return [];
    }

    // ヘッダー行は6行目（index 5）
    const HEADER_ROW_INDEX = 5;

    if (data.values.length <= HEADER_ROW_INDEX) {
      return [];
    }

    const headers = data.values[HEADER_ROW_INDEX] || [];
    const rows: SheetRow[] = [];

    // データ行を処理（ヘッダー行の次から）
    for (let i = HEADER_ROW_INDEX + 1; i < data.values.length; i++) {
      const row = data.values[i];
      const rowData: Partial<SheetRow> = {};

      // 各列をヘッダー名でマッピング
      headers.forEach((header, index) => {
        const value = row[index] || '';
        const key = header.toLowerCase().replace(/\s+/g, '_');

        if (value) {
          rowData[key] = value;
        }
      });

      // 必須フィールドがある行のみ追加
      if (rowData.message_id && rowData.contents) {
        rows.push(rowData as SheetRow);
      }
    }

    return rows;
  } catch (error) {
    if (error instanceof GoogleSheetsError) {
      throw error;
    }
    throw new GoogleSheetsError(
      `Failed to fetch sheet data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      sheetName
    );
  }
}

/**
 * 複数シートからデータを一括取得
 *
 * @param sheetNames - シート名の配列
 * @param onProgress - 進捗コールバック
 * @param delayMs - リクエスト間の待機時間（レート制限対策、デフォルト: 100ms）
 * @returns シート名をキーとしたSheetRowの配列のマップ
 */
export async function getMultipleSheetsData(
  sheetNames: string[],
  onProgress?: (current: number, total: number, sheetName: string) => void,
  delayMs: number = 100
): Promise<Map<string, SheetRow[]>> {
  const results = new Map<string, SheetRow[]>();
  const errors: Array<{ sheetName: string; error: string }> = [];

  for (let i = 0; i < sheetNames.length; i++) {
    const sheetName = sheetNames[i];

    try {
      if (onProgress) {
        onProgress(i + 1, sheetNames.length, sheetName);
      }

      const data = await getSheetData(sheetName);
      results.set(sheetName, data);

      // レート制限対策: 次のリクエストまで待機
      if (i < sheetNames.length - 1 && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      const errorMessage = error instanceof GoogleSheetsError ? error.message : 'Unknown error';
      errors.push({ sheetName, error: errorMessage });
      console.error(`Failed to fetch sheet ${sheetName}:`, errorMessage);
    }
  }

  if (errors.length > 0) {
    console.warn(`Failed to fetch ${errors.length} out of ${sheetNames.length} sheets`);
  }

  return results;
}

/**
 * M6CH01001〜M6CH06029のシート名を生成
 *
 * シート名の形式: M6CH[章番号2桁][章内番号3桁]
 * 例: M6CH01001, M6CH01034, M6CH02001, ..., M6CH06029
 *
 * @param start - 開始番号（デフォルト: 1）
 * @param end - 終了番号（デフォルト: 182）
 * @returns シート名の配列
 */
export function generateSheetNames(start: number = 1, end: number = 182): string[] {
  const sheetNames: string[] = [];

  // 各章のシート数（スプレッドシート構造に基づく）
  const chaptersMap = [
    { chapter: 1, count: 34 },   // M6CH01001 ~ M6CH01034
    { chapter: 2, count: 31 },   // M6CH02001 ~ M6CH02031
    { chapter: 3, count: 31 },   // M6CH03001 ~ M6CH03031
    { chapter: 4, count: 29 },   // M6CH04001 ~ M6CH04029
    { chapter: 5, count: 28 },   // M6CH05001 ~ M6CH05028
    { chapter: 6, count: 29 },   // M6CH06001 ~ M6CH06029
  ];

  let globalIndex = 0;

  for (const { chapter, count } of chaptersMap) {
    for (let sheetNum = 1; sheetNum <= count; sheetNum++) {
      globalIndex++;

      if (globalIndex < start) continue;
      if (globalIndex > end) return sheetNames;

      const chapterPadded = String(chapter).padStart(2, '0');
      const sheetNumPadded = String(sheetNum).padStart(3, '0');
      sheetNames.push(`M6CH${chapterPadded}${sheetNumPadded}`);
    }
  }

  return sheetNames;
}

/**
 * BtoB/BtoCのカテゴリ判定
 *
 * シート名からカテゴリを推定（将来的には別のロジックに置き換え可能）
 *
 * @param sheetName - シート名
 * @returns 'BtoB' | 'BtoC'
 */
export function getCategoryFromSheetName(sheetName: string): 'BtoB' | 'BtoC' {
  // 現時点ではシート名だけでは判定できないため、
  // デフォルトでBtoCを返す
  // TODO: メタデータや別の方法でカテゴリを判定する仕組みが必要
  return 'BtoC';
}

/**
 * シートデータの統計情報
 */
export interface SheetDataStats {
  sheetName: string;
  totalRows: number;
  validRows: number;
  emptyRows: number;
  sections: Set<string>;
  types: Set<string>;
}

/**
 * シートデータの統計情報を取得
 *
 * @param sheetName - シート名
 * @param rows - SheetRowの配列
 * @returns 統計情報
 */
export function getSheetDataStats(sheetName: string, rows: SheetRow[]): SheetDataStats {
  const sections = new Set<string>();
  const types = new Set<string>();
  let validRows = 0;

  rows.forEach((row) => {
    if (row.contents && row.contents.trim().length > 0) {
      validRows++;
    }
    if (row.section) {
      sections.add(row.section);
    }
    if (row.type) {
      types.add(row.type);
    }
  });

  return {
    sheetName,
    totalRows: rows.length,
    validRows,
    emptyRows: rows.length - validRows,
    sections,
    types,
  };
}
