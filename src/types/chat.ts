/**
 * チャット関連の型定義
 */

import type { Category } from './knowledge';

/**
 * チャットメッセージの役割
 */
export type MessageRole = 'user' | 'assistant';

/**
 * チャットメッセージ型
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * チャット履歴のレコード型
 */
export interface ChatHistory {
  id: string;
  session_id: string;
  category: Category;
  user_message: string;
  bot_response: string;
  sources: Source[];
  recommendations: Recommendation[];
  created_at: string;
}

/**
 * チャット履歴挿入用の型
 */
export interface ChatHistoryInsert {
  session_id: string;
  category: Category;
  user_message: string;
  bot_response: string;
  sources?: Source[];
  recommendations?: Recommendation[];
}

/**
 * 参照元情報
 */
export interface Source {
  id: string;
  sheet_name: string | null;
  row_number: number | null;
  content: string;
  similarity: number;
}

/**
 * 関連トピック情報
 */
export interface Recommendation {
  topic: string;
  preview: string;
  similarity?: number;
}

/**
 * チャットAPIリクエスト型
 */
export interface ChatRequest {
  message: string;
  category: Category;
  sessionId: string;
  conversationHistory?: ChatMessage[];
}

/**
 * チャットAPIレスポンス型
 */
export interface ChatResponse {
  response: string;
  sources: Source[];
  recommendations: Recommendation[];
}

/**
 * チャットAPIエラーレスポンス型
 */
export interface ChatErrorResponse {
  error: string;
}
