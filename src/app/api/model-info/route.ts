/**
 * モデル情報API
 *
 * 現在使用中のGeminiモデルと利用可能なモデル一覧を返す
 */

import { NextResponse } from 'next/server';
import { getGenerationModel, getCurrentModel, clearModelCache } from '@/lib/gemini-models';

export async function GET() {
  try {
    // 現在のモデルを取得（キャッシュから or 新規選択）
    const selectedModel = await getGenerationModel();
    const cachedModel = getCurrentModel();

    return NextResponse.json({
      success: true,
      currentModel: selectedModel,
      isCached: cachedModel === selectedModel,
      message: cachedModel === selectedModel
        ? 'Using cached model (refreshes every 24 hours)'
        : 'Newly selected model',
    });
  } catch (error) {
    console.error('Model info error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // キャッシュをクリアして再選択
    clearModelCache();
    const newModel = await getGenerationModel();

    return NextResponse.json({
      success: true,
      message: 'Model cache cleared and refreshed',
      newModel,
    });
  } catch (error) {
    console.error('Model refresh error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
