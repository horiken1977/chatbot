/**
 * 環境変数の管理と検証
 *
 * このファイルで環境変数を一元管理し、型安全にアクセスできるようにします。
 */

/**
 * 環境変数の型定義
 */
interface Env {
  // Gemini API
  geminiApiKey: string | undefined;

  // Supabase
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
  supabaseServiceRoleKey: string | undefined;

  // Google Sheets API
  googleSheetsApiKey: string | undefined;
  googleSheetsSpreadsheetId: string | undefined;
}

/**
 * 環境変数オブジェクト（遅延評価）
 */
export const env = new Proxy({} as Env, {
  get(target, prop: keyof Env) {
    switch (prop) {
      case 'geminiApiKey':
        return process.env.GEMINI_API_KEY;
      case 'supabaseUrl':
        return process.env.NEXT_PUBLIC_SUPABASE_URL;
      case 'supabaseAnonKey':
        return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      case 'supabaseServiceRoleKey':
        return process.env.SUPABASE_SERVICE_ROLE_KEY;
      case 'googleSheetsApiKey':
        return process.env.GOOGLE_SHEETS_API_KEY;
      case 'googleSheetsSpreadsheetId':
        return process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
      default:
        return undefined;
    }
  },
});

/**
 * 必須環境変数のリスト
 */
const requiredEnvVars = {
  server: [
    'GEMINI_API_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_SHEETS_API_KEY',
    'GOOGLE_SHEETS_SPREADSHEET_ID',
  ] as const,
  client: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ] as const,
} as const;

/**
 * サーバーサイド用の環境変数バリデーション
 *
 * @throws {Error} 必須の環境変数が設定されていない場合
 */
export function validateServerEnv(): void {
  const missing = requiredEnvVars.server.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required server environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file.'
    );
  }
}

/**
 * クライアントサイド用の環境変数バリデーション
 *
 * @throws {Error} 必須の環境変数が設定されていない場合
 */
export function validateClientEnv(): void {
  const missing = requiredEnvVars.client.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required client environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and restart the dev server.'
    );
  }
}

/**
 * 全環境変数のバリデーション（サーバーサイドのみ）
 *
 * @throws {Error} 必須の環境変数が設定されていない場合
 */
export function validateAllEnv(): void {
  validateClientEnv();
  validateServerEnv();
}

/**
 * 環境変数の状態をコンソールに出力（デバッグ用）
 *
 * ⚠️ 注意: 本番環境では使用しないこと（APIキーが漏洩する）
 */
export function debugEnv(): void {
  if (process.env.NODE_ENV === 'production') {
    console.warn('debugEnv() should not be called in production');
    return;
  }

  console.log('=== Environment Variables ===');
  console.log('GEMINI_API_KEY:', env.geminiApiKey ? '✅ Set' : '❌ Not set');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', env.supabaseUrl ? '✅ Set' : '❌ Not set');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', env.supabaseAnonKey ? '✅ Set' : '❌ Not set');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', env.supabaseServiceRoleKey ? '✅ Set' : '❌ Not set');
  console.log('GOOGLE_SHEETS_API_KEY:', env.googleSheetsApiKey ? '✅ Set' : '❌ Not set');
  console.log('GOOGLE_SHEETS_SPREADSHEET_ID:', env.googleSheetsSpreadsheetId ? '✅ Set' : '❌ Not set');
  console.log('=============================');
}
