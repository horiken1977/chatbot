-- match_knowledge_by_category 関数の追加
-- カテゴリでフィルタしたベクトル検索関数

CREATE OR REPLACE FUNCTION match_knowledge_by_category(
  query_embedding vector(768),
  filter_category TEXT,
  match_threshold FLOAT DEFAULT 0.5,
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
  WHERE knowledge_base.category = filter_category
    AND 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_knowledge_by_category IS 'ベクトル類似度検索（カテゴリフィルタあり）';
