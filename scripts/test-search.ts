import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';
import { generateEmbedding } from '../src/lib/gemini';

async function testSearch() {
  const question = '売れ続ける仕組みづくりとは何ですか？';
  console.log('質問:', question);

  // 埋め込み生成
  const embedding = await generateEmbedding(question);
  console.log('埋め込み次元:', embedding.length);

  // 検索
  const supabase = getSupabaseAdmin();
  const { data: matches, error } = await supabase.rpc('match_knowledge', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 15,
  });

  if (error) {
    console.error('検索エラー:', error);
    return;
  }

  const matchCount = matches ? matches.length : 0;
  console.log(`\n検索結果: ${matchCount}件\n`);

  if (matches && matches.length > 0) {
    matches.slice(0, 5).forEach((match: any, i: number) => {
      console.log(`${i + 1}. ${match.metadata.sheetName} - ${match.metadata.section}`);
      console.log(`   類似度: ${(match.similarity * 100).toFixed(1)}%`);
      console.log(`   内容: ${match.content.substring(0, 100)}...`);
      console.log('');
    });
  } else {
    console.log('マッチする結果がありません');
  }
}

testSearch().catch(console.error);
