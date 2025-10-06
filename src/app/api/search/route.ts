/**
 * ベクトル検索API
 *
 * クエリテキストから類似するチャンクを検索
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 5, category } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 1. クエリテキストを埋め込みベクトルに変換
    console.log('Generating embedding for query:', query);
    const queryEmbedding = await generateEmbedding(query);

    // 2. ベクトル類似度検索
    const supabase = getSupabaseAdmin();

    let searchQuery = supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5, // 類似度閾値
      match_count: limit,
    });

    // カテゴリフィルタ（オプション）
    if (category) {
      searchQuery = searchQuery.eq('category', category);
    }

    const { data, error } = await searchQuery;

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    console.log(`Found ${data?.length || 0} matching chunks`);

    return NextResponse.json({
      success: true,
      query,
      results: data || [],
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
