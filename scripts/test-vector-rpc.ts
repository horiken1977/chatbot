import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';
import { generateEmbedding } from '../src/lib/gemini';

async function testVectorRPC() {
  const supabase = getSupabaseAdmin();

  const question = 'ソリューションセールスの概要について教えて下さい';
  console.log(`質問: ${question}\n`);

  // 1. 埋め込み生成
  const queryEmbedding = await generateEmbedding(question);
  console.log(`埋め込みベクトル次元数: ${queryEmbedding.length}`);
  console.log(`埋め込みベクトル型: ${typeof queryEmbedding}`);
  console.log(`埋め込みベクトル最初の5要素: ${queryEmbedding.slice(0, 5)}\n`);

  // 2. JSON文字列に変換して渡す（Supabase vector型の要件）
  const embeddingString = JSON.stringify(queryEmbedding);
  console.log(`埋め込みString: ${embeddingString.substring(0, 100)}...\n`);

  // 3. match_knowledge RPCを呼び出し
  const { data: matches, error } = await supabase.rpc('match_knowledge', {
    query_embedding: embeddingString as any, // vector型として認識させる
    match_threshold: 0.3,
    match_count: 10,
  });

  if (error) {
    console.error('RPC Error:', error);
    console.log('\n型を変えて再試行...\n');

    // 配列として渡してみる
    const { data: matches2, error: error2 } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding as any,
      match_threshold: 0.3,
      match_count: 10,
    });

    if (error2) {
      console.error('RPC Error (array):', error2);
    } else {
      console.log(`検索結果: ${matches2?.length}件\n`);
      matches2?.slice(0, 5).forEach((match: any, i: number) => {
        console.log(`${i + 1}. [${match.category}] ${match.sheet_name} - ${match.metadata.type}`);
        console.log(`   類似度: ${(match.similarity * 100).toFixed(1)}%`);
        console.log(`   内容: ${match.content.substring(0, 80)}...\n`);
      });
    }
  } else {
    console.log(`検索結果: ${matches?.length}件\n`);
    matches?.slice(0, 5).forEach((match: any, i: number) => {
      console.log(`${i + 1}. [${match.category}] ${match.sheet_name} - ${match.metadata.type}`);
      console.log(`   類似度: ${(match.similarity * 100).toFixed(1)}%`);
      console.log(`   内容: ${match.content.substring(0, 80)}...\n`);
    });
  }
}

testVectorRPC();
