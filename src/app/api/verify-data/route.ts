/**
 * データ検証API
 *
 * Supabaseに格納されたデータを確認
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // 1. 総レコード数
    const { count: totalCount, error: countError } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Count query failed: ${countError.message}`);
    }

    // 2. カテゴリ別集計
    const { data: categoryData, error: categoryError } = await supabase
      .from('knowledge_base')
      .select('category')
      .limit(1000);

    if (categoryError) {
      throw new Error(`Category query failed: ${categoryError.message}`);
    }

    const categoryCounts = categoryData?.reduce(
      (acc, row) => {
        acc[row.category] = (acc[row.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

    // 3. シート別集計
    const { data: sheetData, error: sheetError } = await supabase
      .from('knowledge_base')
      .select('sheet_name')
      .limit(1000);

    if (sheetError) {
      throw new Error(`Sheet query failed: ${sheetError.message}`);
    }

    const sheetCounts = sheetData?.reduce(
      (acc, row) => {
        if (row.sheet_name) {
          acc[row.sheet_name] = (acc[row.sheet_name] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    ) || {};

    // 4. サンプルレコード（最新5件）
    const { data: sampleData, error: sampleError } = await supabase
      .from('knowledge_base')
      .select('id, category, sheet_name, content, metadata')
      .order('created_at', { ascending: false })
      .limit(5);

    if (sampleError) {
      throw new Error(`Sample query failed: ${sampleError.message}`);
    }

    // 5. 埋め込みベクトルの検証
    const { data: embeddingData, error: embeddingError } = await supabase
      .from('knowledge_base')
      .select('id, embedding')
      .not('embedding', 'is', null)
      .limit(1);

    if (embeddingError) {
      throw new Error(`Embedding query failed: ${embeddingError.message}`);
    }

    const embeddingDimension = embeddingData?.[0]?.embedding
      ? (embeddingData[0].embedding as unknown as number[]).length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalRecords: totalCount || 0,
        categoryBreakdown: categoryCounts,
        sheetBreakdown: sheetCounts,
        embeddingDimension,
        sampleRecords: sampleData?.map((record) => ({
          id: record.id,
          category: record.category,
          sheetName: record.sheet_name,
          contentPreview: record.content.substring(0, 100) + (record.content.length > 100 ? '...' : ''),
          metadata: record.metadata,
        })),
      },
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
