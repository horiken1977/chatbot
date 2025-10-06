import { NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';

/**
 * Supabase接続テスト用API
 *
 * ⚠️ 開発用のみ。本番環境では削除すること。
 *
 * アクセス: http://localhost:3000/api/test-supabase
 */
export async function GET() {
  // 開発環境でのみ動作
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  const results: {
    clientTest: { success: boolean; message: string; error?: string };
    adminTest: { success: boolean; message: string; error?: string };
    tableTest: { success: boolean; message: string; error?: string };
  } = {
    clientTest: { success: false, message: '' },
    adminTest: { success: false, message: '' },
    tableTest: { success: false, message: '' },
  };

  // テスト1: クライアント接続テスト
  try {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('count');

    if (error) {
      results.clientTest = {
        success: false,
        message: 'Client connection failed',
        error: error.message,
      };
    } else {
      results.clientTest = {
        success: true,
        message: 'Client connection successful ✅',
      };
    }
  } catch (error) {
    results.clientTest = {
      success: false,
      message: 'Client connection error',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // テスト2: Admin接続テスト
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('knowledge_base')
      .select('count');

    if (error) {
      results.adminTest = {
        success: false,
        message: 'Admin connection failed',
        error: error.message,
      };
    } else {
      results.adminTest = {
        success: true,
        message: 'Admin connection successful ✅',
      };
    }
  } catch (error) {
    results.adminTest = {
      success: false,
      message: 'Admin connection error',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // テスト3: テーブル存在確認
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // knowledge_base テーブル確認
    const { data: kbData, error: kbError } = await supabaseAdmin
      .from('knowledge_base')
      .select('id')
      .limit(1);

    // chat_history テーブル確認
    const { data: chData, error: chError } = await supabaseAdmin
      .from('chat_history')
      .select('id')
      .limit(1);

    if (kbError || chError) {
      results.tableTest = {
        success: false,
        message: 'Table check failed',
        error: kbError?.message || chError?.message,
      };
    } else {
      results.tableTest = {
        success: true,
        message: 'Tables exist ✅ (knowledge_base, chat_history)',
      };
    }
  } catch (error) {
    results.tableTest = {
      success: false,
      message: 'Table check error',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // 全体の成功判定
  const allSuccess =
    results.clientTest.success &&
    results.adminTest.success &&
    results.tableTest.success;

  return NextResponse.json({
    status: allSuccess ? 'All tests passed ✅' : 'Some tests failed ❌',
    results,
  });
}
