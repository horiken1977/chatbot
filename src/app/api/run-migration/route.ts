/**
 * マイグレーション実行API（開発用）
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();

    // マイグレーションSQLを読み込み
    const migrationPath = join(process.cwd(), 'supabase/migrations/002_match_knowledge_function.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    // SQLを実行
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // rpc('exec_sql')が存在しない場合は、直接SQLを実行
      const { error: directError } = await supabase.from('_migrations').insert({ name: '002_match_knowledge_function', sql });

      if (directError) {
        // 最終手段: 手動でSQL実行
        console.log('Please run this SQL manually in Supabase Studio:');
        console.log(sql);

        return NextResponse.json({
          success: false,
          error: 'Cannot execute migration automatically. Please run SQL manually.',
          sql,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration executed successfully',
    });
  } catch (error) {
    console.error('Migration error:', error);

    // マイグレーションSQLを返して手動実行を促す
    try {
      const migrationPath = join(process.cwd(), 'supabase/migrations/002_match_knowledge_function.sql');
      const sql = readFileSync(migrationPath, 'utf-8');

      return NextResponse.json({
        success: false,
        error: 'Please copy and run this SQL in Supabase Studio SQL Editor',
        sql,
      });
    } catch {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  }
}
