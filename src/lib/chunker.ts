/**
 * チャンク分割ユーティリティ
 *
 * 長いテキストを意味のある単位に分割し、
 * RAGに適したサイズのチャンクを生成する
 */

import { cleanText, processContentByType } from './text-cleaner';

export interface ChunkMetadata {
  sheetName: string;
  section: string; // Intro, Lecture, etc.
  type: string; // article, description, text, survey, etc.
  messageId: string;
  hasChoices: boolean;
  correctAnswer?: string;
  [key: string]: unknown;
}

export interface Chunk {
  content: string;
  context: string; // 前後のメッセージ
  metadata: ChunkMetadata;
}

export interface SheetRow {
  message_id: string;
  section: string;
  type: string;
  subtype?: string;
  contents: string;
  choices?: string;
  correct_answer?: string;
  [key: string]: unknown;
}

/**
 * トークン数を概算で計算
 * 日本語: 1文字 ≈ 2トークン
 * 英数字: 1単語 ≈ 1トークン
 *
 * @param text - 対象テキスト
 * @returns 概算トークン数
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;

  // 日本語文字数（ひらがな、カタカナ、漢字）
  const japaneseChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;

  // 英数字単語数
  const englishWords = (text.match(/[a-zA-Z0-9]+/g) || []).length;

  // その他の文字数
  const otherChars = text.length - japaneseChars - englishWords;

  // 概算: 日本語は2トークン/文字、英数字は1トークン/単語、その他は0.5トークン/文字
  return Math.ceil(japaneseChars * 2 + englishWords * 1 + otherChars * 0.5);
}

/**
 * 文章を意味のある単位で分割
 *
 * @param text - 分割対象テキスト
 * @param maxTokens - 最大トークン数
 * @returns 分割されたテキストの配列
 */
export function splitTextByTokens(text: string, maxTokens: number = 500): string[] {
  const tokens = estimateTokenCount(text);

  // maxTokens以下なら分割不要
  if (tokens <= maxTokens) {
    return [text];
  }

  const chunks: string[] = [];

  // まず段落で分割（\n\n）
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';
  let currentTokens = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokenCount(paragraph);

    // 段落単体がmaxTokensを超える場合は文単位で分割
    if (paragraphTokens > maxTokens) {
      // 現在のチャンクを保存
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentTokens = 0;
      }

      // 文単位で分割
      const sentences = paragraph.split(/[。．！？\n]/);
      for (const sentence of sentences) {
        if (!sentence.trim()) continue;

        const sentenceWithPeriod = sentence + '。';
        const sentenceTokens = estimateTokenCount(sentenceWithPeriod);

        if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentenceWithPeriod;
          currentTokens = sentenceTokens;
        } else {
          currentChunk += sentenceWithPeriod;
          currentTokens += sentenceTokens;
        }
      }
    } else {
      // 段落を追加できるかチェック
      if (currentTokens + paragraphTokens > maxTokens && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
        currentTokens = paragraphTokens;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        currentTokens += paragraphTokens;
      }
    }
  }

  // 残りを追加
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * 前後のメッセージから文脈を生成
 *
 * @param rows - シート全体の行データ
 * @param currentIndex - 現在の行インデックス
 * @param contextSize - 前後何行を含めるか（デフォルト: 1）
 * @returns 文脈テキスト
 */
export function generateContext(rows: SheetRow[], currentIndex: number, contextSize: number = 1): string {
  const contextParts: string[] = [];

  // 前のメッセージ
  for (let i = Math.max(0, currentIndex - contextSize); i < currentIndex; i++) {
    const row = rows[i];
    if (row && row.contents) {
      const cleaned = cleanText(row.contents);
      if (cleaned) {
        contextParts.push(`[前] ${cleaned.substring(0, 100)}...`);
      }
    }
  }

  // 後のメッセージ
  for (let i = currentIndex + 1; i <= Math.min(rows.length - 1, currentIndex + contextSize); i++) {
    const row = rows[i];
    if (row && row.contents) {
      const cleaned = cleanText(row.contents);
      if (cleaned) {
        contextParts.push(`[後] ${cleaned.substring(0, 100)}...`);
      }
    }
  }

  return contextParts.join('\n');
}

/**
 * 行データからチャンクを生成
 *
 * @param row - シートの行データ
 * @param sheetName - シート名
 * @param context - 前後のメッセージ文脈
 * @param maxTokens - チャンクの最大トークン数
 * @returns チャンクの配列
 */
export function createChunksFromRow(
  row: SheetRow,
  sheetName: string,
  context: string = '',
  maxTokens: number = 500
): Chunk[] {
  // コンテンツをクリーニング＆タイプ別処理
  const processedContent = processContentByType(row.contents, row.type, row.choices, row.correct_answer);

  // 空または無効なコンテンツはスキップ
  if (!processedContent || processedContent.trim().length < 10) {
    return [];
  }

  // チャンク分割
  const contentChunks = splitTextByTokens(processedContent, maxTokens);

  // メタデータ作成
  const baseMetadata: ChunkMetadata = {
    sheetName,
    section: row.section || 'Unknown',
    type: row.type || 'text',
    messageId: row.message_id,
    hasChoices: Boolean(row.choices),
  };

  if (row.correct_answer) {
    baseMetadata.correctAnswer = row.correct_answer;
  }

  // 各チャンクにメタデータと文脈を付加
  return contentChunks.map((content, index) => ({
    content,
    context,
    metadata: {
      ...baseMetadata,
      chunkIndex: index,
      totalChunks: contentChunks.length,
    },
  }));
}

/**
 * シート全体からチャンクを生成
 *
 * @param rows - シートの全行データ
 * @param sheetName - シート名
 * @param maxTokens - チャンクの最大トークン数
 * @param contextSize - 前後何行を文脈に含めるか
 * @returns チャンクの配列
 */
export function createChunksFromSheet(
  rows: SheetRow[],
  sheetName: string,
  maxTokens: number = 500,
  contextSize: number = 1
): Chunk[] {
  const allChunks: Chunk[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // message_idとcontentsが必須
    if (!row.message_id || !row.contents) {
      continue;
    }

    // 文脈生成
    const context = generateContext(rows, i, contextSize);

    // チャンク生成
    const chunks = createChunksFromRow(row, sheetName, context, maxTokens);

    allChunks.push(...chunks);
  }

  return allChunks;
}

/**
 * チャンク統計情報
 */
export interface ChunkStats {
  totalChunks: number;
  averageTokens: number;
  maxTokens: number;
  minTokens: number;
  emptyChunks: number;
  bySection: Record<string, number>;
  byType: Record<string, number>;
}

/**
 * チャンクの統計情報を取得
 *
 * @param chunks - チャンクの配列
 * @returns 統計情報
 */
export function getChunkStats(chunks: Chunk[]): ChunkStats {
  const tokenCounts = chunks.map((chunk) => estimateTokenCount(chunk.content));
  const bySection: Record<string, number> = {};
  const byType: Record<string, number> = {};

  chunks.forEach((chunk) => {
    bySection[chunk.metadata.section] = (bySection[chunk.metadata.section] || 0) + 1;
    byType[chunk.metadata.type] = (byType[chunk.metadata.type] || 0) + 1;
  });

  return {
    totalChunks: chunks.length,
    averageTokens: tokenCounts.length > 0 ? Math.round(tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length) : 0,
    maxTokens: tokenCounts.length > 0 ? Math.max(...tokenCounts) : 0,
    minTokens: tokenCounts.length > 0 ? Math.min(...tokenCounts) : 0,
    emptyChunks: chunks.filter((chunk) => !chunk.content || chunk.content.trim().length === 0).length,
    bySection,
    byType,
  };
}
