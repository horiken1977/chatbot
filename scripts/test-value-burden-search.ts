import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';
import { generateEmbedding } from '../src/lib/gemini';

interface KnowledgeMatch {
  id: string;
  content: string;
  context: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

async function testSearch() {
  const question = '顧客が商品を購入する際に比較する「価値」と「負担」について教えて下さい。';
  console.log('質問:', question);

  // 埋め込み生成
  const embedding = await generateEmbedding(question);

  // 検索
  const supabase = getSupabaseAdmin();
  const { data: matches, error } = await supabase.rpc('match_knowledge', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 50,
  });

  if (error) {
    console.error('検索エラー:', error);
    return;
  }

  const allMatches = (matches || []) as KnowledgeMatch[];

  // survey/questionを除外
  const filtered = allMatches.filter(
    (match) => match.metadata.type !== 'survey' && match.metadata.type !== 'question'
  );

  console.log(`\n検索結果: ${allMatches.length}件（survey/question除外後: ${filtered.length}件）\n`);

  if (filtered.length > 0) {
    console.log('=== 上位5件の内容 ===\n');
    filtered.slice(0, 5).forEach((match: any, i: number) => {
      console.log(`${i + 1}. ${match.metadata.sheetName} - ${match.metadata.section} (${match.metadata.type})`);
      console.log(`   類似度: ${(match.similarity * 100).toFixed(1)}%`);
      console.log(`   内容: ${match.content.substring(0, 300)}...`);
      console.log('');
    });
  } else {
    console.log('マッチする結果がありません');
  }

  // 「価値」と「負担」を含むコンテンツを確認
  const { data: valueContent, error: valueError } = await supabase
    .from('knowledge_base')
    .select('content, metadata')
    .ilike('content', '%価値%')
    .ilike('content', '%負担%')
    .limit(5);

  if (!valueError && valueContent && valueContent.length > 0) {
    console.log('\n=== 「価値」と「負担」を含むコンテンツ（5件） ===\n');
    valueContent.forEach((item: any, i: number) => {
      console.log(`${i + 1}. ${item.metadata.sheetName} - ${item.metadata.type}`);
      console.log(`   内容: ${item.content.substring(0, 200)}...\n`);
    });
  }
}

testSearch().catch(console.error);
