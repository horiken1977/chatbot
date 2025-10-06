/**
 * テキストクリーニングユーティリティ
 *
 * Google Sheetsから取得した汚いデータをクリーニングし、
 * RAGに適した形式に整形する
 */

export interface CleaningOptions {
  removeCustomTags?: boolean;
  removeHtmlTags?: boolean;
  removeImageUrls?: boolean;
  normalizeWhitespace?: boolean;
  normalizeSpecialChars?: boolean;
}

const DEFAULT_OPTIONS: Required<CleaningOptions> = {
  removeCustomTags: true,
  removeHtmlTags: true,
  removeImageUrls: true,
  normalizeWhitespace: true,
  normalizeSpecialChars: true,
};

/**
 * カスタムタグを除去
 * [びpho], [dwflw], [zmH08], {center} など
 */
function removeCustomTags(text: string): string {
  // [xxx] 形式のタグを除去
  text = text.replace(/\[[\w\u3040-\u309F\u30A0-\u30FF]+\]/g, '');

  // {xxx} 形式のタグを除去
  text = text.replace(/\{[\w\u3040-\u309F\u30A0-\u30FF]+\}/g, '');

  return text;
}

/**
 * HTMLタグを除去
 */
function removeHtmlTags(text: string): string {
  // <style>...</style> ブロック全体を除去
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // <script>...</script> ブロック全体を除去（念のため）
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // その他のHTMLタグを除去
  text = text.replace(/<[^>]+>/g, '');

  return text;
}

/**
 * 画像URLとプレースホルダーを除去/置換
 */
function removeImageUrls(text: string): string {
  // Firebase Storage URLを [画像] に置換
  text = text.replace(/https:\/\/firebasestorage\.googleapis\.com\/[^\s]+/g, '[画像]');

  // --- img などのプレースホルダーを除去
  text = text.replace(/---\s*img/gi, '');

  return text;
}

/**
 * 空白・改行の正規化
 */
function normalizeWhitespace(text: string): string {
  // 連続する空白を1つに
  text = text.replace(/[ \t]+/g, ' ');

  // 連続する改行を2つまでに
  text = text.replace(/\n{3,}/g, '\n\n');

  // 前後の空白をトリム
  text = text.trim();

  return text;
}

/**
 * 特殊文字の正規化
 */
function normalizeSpecialChars(text: string): string {
  // 全角スペースを半角に
  text = text.replace(/　/g, ' ');

  // ゼロ幅文字を除去
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 制御文字を除去（改行・タブ以外）
  text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return text;
}

/**
 * テキストをクリーニング
 *
 * @param text - クリーニング対象のテキスト
 * @param options - クリーニングオプション
 * @returns クリーニング済みテキスト
 */
export function cleanText(text: string, options: CleaningOptions = {}): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  let cleaned = text;

  // Phase 1: タグ除去
  if (opts.removeCustomTags) {
    cleaned = removeCustomTags(cleaned);
  }

  if (opts.removeHtmlTags) {
    cleaned = removeHtmlTags(cleaned);
  }

  if (opts.removeImageUrls) {
    cleaned = removeImageUrls(cleaned);
  }

  // Phase 2: テキスト正規化
  if (opts.normalizeSpecialChars) {
    cleaned = normalizeSpecialChars(cleaned);
  }

  if (opts.normalizeWhitespace) {
    cleaned = normalizeWhitespace(cleaned);
  }

  return cleaned;
}

/**
 * メッセージタイプに応じた処理
 */
export function processContentByType(
  content: string,
  type: string,
  choices?: string,
  correctAnswer?: string
): string {
  const cleaned = cleanText(content);

  switch (type) {
    case 'survey':
    case 'multiple_choice':
      // 質問文 + 選択肢を統合
      if (choices) {
        return `${cleaned}\n\n選択肢:\n${choices}`;
      }
      return cleaned;

    case 'Lecture':
    case 'description':
    case 'text':
    case 'article':
      // 説明文・講義内容はそのまま
      return cleaned;

    default:
      return cleaned;
  }
}

/**
 * コンテンツが有意義かチェック
 *
 * @param text - チェック対象のテキスト
 * @param minLength - 最小文字数（デフォルト: 10）
 * @returns 有意義なコンテンツかどうか
 */
export function isValidContent(text: string, minLength: number = 10): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const trimmed = text.trim();

  // 最小文字数チェック
  if (trimmed.length < minLength) {
    return false;
  }

  // 記号だけでないかチェック
  const alphanumericCount = (trimmed.match(/[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
  if (alphanumericCount < minLength / 2) {
    return false;
  }

  return true;
}

/**
 * デバッグ用: クリーニング前後を比較
 */
export function cleaningDiff(original: string): { before: string; after: string; changes: string[] } {
  const changes: string[] = [];
  const before = original;
  let after = original;

  // カスタムタグ
  const customTagsMatch = original.match(/\[[\w\u3040-\u309F\u30A0-\u30FF]+\]/g);
  if (customTagsMatch) {
    changes.push(`カスタムタグ除去: ${customTagsMatch.length}個`);
    after = removeCustomTags(after);
  }

  // HTMLタグ
  const htmlTagsMatch = original.match(/<[^>]+>/g);
  if (htmlTagsMatch) {
    changes.push(`HTMLタグ除去: ${htmlTagsMatch.length}個`);
    after = removeHtmlTags(after);
  }

  // 画像URL
  const imageUrlsMatch = original.match(/https:\/\/firebasestorage\.googleapis\.com\/[^\s]+/g);
  if (imageUrlsMatch) {
    changes.push(`画像URL置換: ${imageUrlsMatch.length}個`);
    after = removeImageUrls(after);
  }

  // 特殊文字・空白
  after = normalizeSpecialChars(after);
  after = normalizeWhitespace(after);

  if (before.length !== after.length) {
    changes.push(`文字数: ${before.length} → ${after.length}`);
  }

  return { before, after, changes };
}
