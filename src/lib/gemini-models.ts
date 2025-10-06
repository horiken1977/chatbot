/**
 * Gemini モデル管理
 *
 * 利用可能なモデルを自動検出し、最適なモデルを選択
 */

import { env } from './env';

interface GeminiModel {
  name: string;
  displayName: string;
  supportedGenerationMethods: string[];
}

interface ModelsResponse {
  models: GeminiModel[];
}

let cachedModel: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24時間

/**
 * モデル選択の優先順位
 * 新しいモデルや高性能モデルを優先
 */
const MODEL_PRIORITY = [
  // Gemini 2.5シリーズ（最新）
  'gemini-2.5-flash',
  'gemini-2.5-flash-latest',
  'gemini-2.5-pro',

  // Gemini 2.0シリーズ
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',

  // Gemini 1.5シリーズ（フォールバック）
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',

  // レガシー（最終フォールバック）
  'gemini-pro',
];

/**
 * 利用可能なモデル一覧を取得
 */
async function fetchAvailableModels(): Promise<string[]> {
  const apiKey = env.geminiApiKey;

  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      console.warn(`Failed to fetch models list: ${response.status}`);
      return [];
    }

    const data: ModelsResponse = await response.json();

    // generateContentをサポートするモデルのみフィルタ
    const availableModels = data.models
      .filter((model) => model.supportedGenerationMethods.includes('generateContent'))
      .map((model) => model.name.replace('models/', ''));

    console.log(`Found ${availableModels.length} available Gemini models`);
    return availableModels;
  } catch (error) {
    console.error('Error fetching Gemini models:', error);
    return [];
  }
}

/**
 * 最適なモデルを選択
 */
async function selectBestModel(): Promise<string> {
  // キャッシュチェック（24時間以内）
  const now = Date.now();
  if (cachedModel && now - cacheTimestamp < CACHE_DURATION) {
    return cachedModel;
  }

  try {
    const availableModels = await fetchAvailableModels();

    if (availableModels.length === 0) {
      // APIが利用できない場合はデフォルトを返す
      console.warn('Could not fetch models, using default: gemini-2.0-flash');
      return 'gemini-2.0-flash';
    }

    // 優先順位に従って最初に見つかったモデルを使用
    for (const preferredModel of MODEL_PRIORITY) {
      const found = availableModels.find((model) => model.includes(preferredModel));
      if (found) {
        console.log(`Selected Gemini model: ${found}`);
        cachedModel = found;
        cacheTimestamp = now;
        return found;
      }
    }

    // 優先順位に一致しない場合は最初の利用可能なモデル
    const fallbackModel = availableModels[0];
    console.log(`Using fallback model: ${fallbackModel}`);
    cachedModel = fallbackModel;
    cacheTimestamp = now;
    return fallbackModel;
  } catch (error) {
    console.error('Error selecting model:', error);
    // エラー時はデフォルト
    return 'gemini-2.0-flash';
  }
}

/**
 * テキスト生成用のモデルを取得
 */
export async function getGenerationModel(): Promise<string> {
  return selectBestModel();
}

/**
 * モデルキャッシュをクリア（手動更新用）
 */
export function clearModelCache(): void {
  cachedModel = null;
  cacheTimestamp = 0;
  console.log('Model cache cleared');
}

/**
 * 現在使用中のモデル名を取得（キャッシュから）
 */
export function getCurrentModel(): string | null {
  return cachedModel;
}
