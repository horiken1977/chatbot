import { NextResponse } from 'next/server';
import { debugEnv, env } from '@/lib/env';

/**
 * 環境変数テスト用API
 *
 * ⚠️ 開発用のみ。本番環境では削除すること。
 *
 * アクセス: http://localhost:3000/api/test-env
 */
export async function GET() {
  // 開発環境でのみ動作
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  // 環境変数の状態をコンソールに出力
  debugEnv();

  // APIレスポンス
  return NextResponse.json({
    message: 'Environment variables check',
    status: {
      geminiApiKey: env.geminiApiKey ? 'Set ✅' : 'Not set ❌',
      supabaseUrl: env.supabaseUrl ? 'Set ✅' : 'Not set ❌',
      supabaseAnonKey: env.supabaseAnonKey ? 'Set ✅' : 'Not set ❌',
      supabaseServiceRoleKey: env.supabaseServiceRoleKey ? 'Set ✅' : 'Not set ❌',
      googleSheetsApiKey: env.googleSheetsApiKey ? 'Set ✅' : 'Not set ❌',
      googleSheetsSpreadsheetId: env.googleSheetsSpreadsheetId ? 'Set ✅' : 'Not set ❌',
    },
    note: 'Check the terminal for detailed output',
  });
}
