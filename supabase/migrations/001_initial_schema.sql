-- マーケティングナレッジチャットボット 初期スキーマ
-- 作成日: 2025-10-05
-- 説明: ベクトルストアとチャット履歴テーブルの作成

-- ============================================
-- 1. pgvector拡張機能の有効化
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 2. knowledge_base テーブル（ベクトルストア）
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('BtoB', 'BtoC')),
  sheet_name TEXT,
  row_number INTEGER,
  content TEXT NOT NULL,
  context TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category
  ON knowledge_base(category);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at
  ON knowledge_base(created_at DESC);

-- ベクトル検索用インデックス（IVFFlat）
-- lists=100: 約1000-10000件のデータに適した設定
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding
  ON knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- コメント
COMMENT ON TABLE knowledge_base IS 'マーケティングナレッジのベクトルストア';
COMMENT ON COLUMN knowledge_base.category IS 'BtoB または BtoC';
COMMENT ON COLUMN knowledge_base.sheet_name IS 'Google Sheetsのシート名';
COMMENT ON COLUMN knowledge_base.row_number IS 'スプレッドシートの行番号';
COMMENT ON COLUMN knowledge_base.content IS 'ナレッジの本文';
COMMENT ON COLUMN knowledge_base.context IS '前後の文脈';
COMMENT ON COLUMN knowledge_base.metadata IS '追加情報（JSONフォーマット）';
COMMENT ON COLUMN knowledge_base.embedding IS 'テキストのベクトル表現（768次元）';

-- ============================================
-- 3. chat_history テーブル（チャット履歴）
-- ============================================
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('BtoB', 'BtoC')),
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_chat_history_session
  ON chat_history(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_history_category
  ON chat_history(category);

CREATE INDEX IF NOT EXISTS idx_chat_history_created_at
  ON chat_history(created_at DESC);

-- コメント
COMMENT ON TABLE chat_history IS 'チャット履歴';
COMMENT ON COLUMN chat_history.session_id IS 'セッションID（ブラウザごとに一意）';
COMMENT ON COLUMN chat_history.category IS 'BtoB または BtoC';
COMMENT ON COLUMN chat_history.user_message IS 'ユーザーの質問';
COMMENT ON COLUMN chat_history.bot_response IS 'ボットの回答';
COMMENT ON COLUMN chat_history.sources IS '参照元ナレッジのID配列';
COMMENT ON COLUMN chat_history.recommendations IS '関連トピックの配列';

-- ============================================
-- 4. Row Level Security (RLS) の設定
-- ============================================
-- 注意: 現時点では認証機能がないため、RLSは無効化
-- 将来的にユーザー認証を実装する際に有効化

-- ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. 関数: updated_at の自動更新
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ベクトル検索用の関数
-- ============================================
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(768),
  match_category TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  sheet_name TEXT,
  row_number INTEGER,
  content TEXT,
  context TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_base.id,
    knowledge_base.category,
    knowledge_base.sheet_name,
    knowledge_base.row_number,
    knowledge_base.content,
    knowledge_base.context,
    knowledge_base.metadata,
    1 - (knowledge_base.embedding <=> query_embedding) AS similarity
  FROM knowledge_base
  WHERE knowledge_base.category = match_category
    AND 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_knowledge IS 'ベクトル類似度検索（コサイン類似度）';

-- ============================================
-- 7. テストデータ（開発用・削除可能）
-- ============================================
-- 実際のデータ投入時には削除してください

-- INSERT INTO knowledge_base (category, sheet_name, content, embedding)
-- VALUES (
--   'BtoC',
--   'TEST_SHEET',
--   'これはテストデータです。',
--   '[0,0,0,...]'::vector(768)
-- );

-- ============================================
-- 完了メッセージ
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'マイグレーション完了: knowledge_base および chat_history テーブルが作成されました';
END
$$;
