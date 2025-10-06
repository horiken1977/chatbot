/**
 * ナレッジベース関連の型定義
 */

/**
 * カテゴリ型
 */
export type Category = 'BtoB' | 'BtoC';

/**
 * ナレッジベースのレコード型
 */
export interface KnowledgeBase {
  id: string;
  category: Category;
  sheet_name: string | null;
  row_number: number | null;
  content: string;
  context: string | null;
  metadata: Record<string, unknown>;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * ナレッジベース挿入用の型
 */
export interface KnowledgeBaseInsert {
  category: Category;
  sheet_name?: string;
  row_number?: number;
  content: string;
  context?: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
}

/**
 * ベクトル検索の結果型
 */
export interface SearchResult {
  id: string;
  category: Category;
  sheet_name: string | null;
  row_number: number | null;
  content: string;
  context: string | null;
  metadata: Record<string, unknown>;
  similarity: number;
}

/**
 * ベクトル検索のパラメータ型
 */
export interface SearchParams {
  queryEmbedding: number[];
  category: Category;
  threshold?: number; // デフォルト: 0.7
  limit?: number; // デフォルト: 5
}
