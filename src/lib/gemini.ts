/**
 * Google Gemini APIクライアント
 *
 * テキスト埋め込み（Embedding）生成
 */

import { env } from './env';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const EMBEDDING_MODEL = 'text-embedding-004'; // 768次元
const BATCH_SIZE = 100; // Gemini APIのバッチ制限

/**
 * Gemini APIエラー
 */
export class GeminiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

/**
 * Embedding APIレスポンスの型
 */
interface EmbeddingResponse {
  embedding?: {
    values: number[];
  };
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

interface BatchEmbeddingRequest {
  requests: Array<{
    model: string;
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

interface BatchEmbeddingResponse {
  embeddings?: Array<{
    values: number[];
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * テキストの埋め込みベクトルを生成
 *
 * @param text - 埋め込み対象のテキスト
 * @returns 埋め込みベクトル（768次元）
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = env.geminiApiKey;

  if (!apiKey) {
    throw new GeminiError('Gemini API key not configured');
  }

  if (!text || text.trim().length === 0) {
    throw new GeminiError('Text cannot be empty');
  }

  const url = `${GEMINI_API_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: {
          parts: [{ text }],
        },
      }),
    });

    if (!response.ok) {
      throw new GeminiError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    const data: EmbeddingResponse = await response.json();

    if (data.error) {
      throw new GeminiError(data.error.message, data.error.code, data.error.status);
    }

    if (!data.embedding || !data.embedding.values) {
      throw new GeminiError('Invalid embedding response');
    }

    return data.embedding.values;
  } catch (error) {
    if (error instanceof GeminiError) {
      throw error;
    }
    throw new GeminiError(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 複数のテキストの埋め込みベクトルを一括生成
 *
 * @param texts - 埋め込み対象のテキスト配列
 * @param onProgress - 進捗コールバック
 * @param delayMs - バッチ間の待機時間（レート制限対策、デフォルト: 1000ms）
 * @returns 埋め込みベクトルの配列
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  onProgress?: (current: number, total: number) => void,
  delayMs: number = 1000
): Promise<number[][]> {
  const apiKey = env.geminiApiKey;

  if (!apiKey) {
    throw new GeminiError('Gemini API key not configured');
  }

  if (texts.length === 0) {
    return [];
  }

  const allEmbeddings: number[][] = [];
  const errors: Array<{ index: number; error: string }> = [];

  // BATCH_SIZE個ずつに分割して処理
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, Math.min(i + BATCH_SIZE, texts.length));

    try {
      if (onProgress) {
        onProgress(i + batch.length, texts.length);
      }

      const batchEmbeddings = await processBatch(batch);
      allEmbeddings.push(...batchEmbeddings);

      // レート制限対策: 次のバッチまで待機
      if (i + BATCH_SIZE < texts.length && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      const errorMessage = error instanceof GeminiError ? error.message : 'Unknown error';
      console.error(`Failed to process batch ${i / BATCH_SIZE + 1}:`, errorMessage);

      // バッチ全体が失敗した場合、個別に処理
      for (let j = 0; j < batch.length; j++) {
        try {
          const embedding = await generateEmbedding(batch[j]);
          allEmbeddings.push(embedding);

          // 個別リクエスト間も少し待機
          if (j < batch.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        } catch (individualError) {
          const idx = i + j;
          errors.push({
            index: idx,
            error: individualError instanceof Error ? individualError.message : 'Unknown error',
          });
          console.error(`Failed to generate embedding for text ${idx}:`, individualError);
          // エラーの場合は空ベクトルをプレースホルダーとして追加
          allEmbeddings.push(new Array(768).fill(0));
        }
      }
    }
  }

  if (errors.length > 0) {
    console.warn(`Failed to generate ${errors.length} out of ${texts.length} embeddings`);
  }

  return allEmbeddings;
}

/**
 * バッチリクエストを処理
 *
 * @param texts - テキスト配列
 * @returns 埋め込みベクトルの配列
 */
async function processBatch(texts: string[]): Promise<number[][]> {
  const apiKey = env.geminiApiKey;

  if (!apiKey) {
    throw new GeminiError('Gemini API key not configured');
  }

  const url = `${GEMINI_API_BASE}/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`;

  const requestBody: BatchEmbeddingRequest = {
    requests: texts.map((text) => ({
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text: text || ' ' }], // 空文字の場合はスペースに置き換え
      },
    })),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new GeminiError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    const data: BatchEmbeddingResponse = await response.json();

    if (data.error) {
      throw new GeminiError(data.error.message, data.error.code, data.error.status);
    }

    if (!data.embeddings || !Array.isArray(data.embeddings)) {
      throw new GeminiError('Invalid batch embedding response');
    }

    return data.embeddings.map((emb) => emb.values);
  } catch (error) {
    if (error instanceof GeminiError) {
      throw error;
    }
    throw new GeminiError(`Failed to process batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * テキストをチャンクに分割して埋め込みを生成
 *
 * Gemini APIの入力制限（~2048トークン）を考慮
 *
 * @param text - 長いテキスト
 * @param maxChars - チャンクの最大文字数（デフォルト: 3000）
 * @returns 埋め込みベクトル（複数チャンクの平均）
 */
export async function generateEmbeddingForLongText(text: string, maxChars: number = 3000): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new GeminiError('Text cannot be empty');
  }

  // maxChars以下ならそのまま処理
  if (text.length <= maxChars) {
    return generateEmbedding(text);
  }

  // チャンクに分割
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }

  // 各チャンクの埋め込みを生成
  const embeddings = await generateEmbeddingsBatch(chunks);

  // 平均ベクトルを計算
  const avgEmbedding = new Array(768).fill(0);
  embeddings.forEach((embedding) => {
    embedding.forEach((value, index) => {
      avgEmbedding[index] += value / embeddings.length;
    });
  });

  return avgEmbedding;
}

/**
 * 埋め込みベクトルの検証
 *
 * @param embedding - 検証対象の埋め込みベクトル
 * @returns 検証結果
 */
export function validateEmbedding(embedding: number[]): { valid: boolean; error?: string } {
  if (!Array.isArray(embedding)) {
    return { valid: false, error: 'Embedding is not an array' };
  }

  if (embedding.length !== 768) {
    return { valid: false, error: `Expected 768 dimensions, got ${embedding.length}` };
  }

  if (embedding.some((value) => typeof value !== 'number' || !isFinite(value))) {
    return { valid: false, error: 'Embedding contains invalid values' };
  }

  return { valid: true };
}
