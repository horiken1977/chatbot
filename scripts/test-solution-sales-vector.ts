import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';
import { generateEmbedding } from '../src/lib/gemini';

async function testSolutionSalesVector() {
  const supabase = getSupabaseAdmin();

  const question = 'ソリューションセールスの概要について教えて下さい';
  console.log(`質問: ${question}\n`);

  // 1. 埋め込み生成
  const queryEmbedding = await generateEmbedding(question);

  console.log(`埋め込みベクトル次元数: ${queryEmbedding.length}\n`);

  // 2. ベクトル検索（カテゴリフィルタなし）
  const { data: allMatches, error: allError } = await supabase.rpc('match_knowledge', {
    query_embedding: queryEmbedding,
    match_threshold: 0.3,
    match_count: 50,
  });

  if (allError) {
    console.error('全体検索エラー:', allError);
    return;
  }

  console.log(`=== 全体検索結果（上位10件） ===`);
  allMatches?.slice(0, 10).forEach((match: any, i: number) => {
    console.log(`${i + 1}. [${match.metadata.category}] ${match.metadata.sheetName} - ${match.metadata.type}`);
    console.log(`   類似度: ${(match.similarity * 100).toFixed(1)}%`);
    console.log(`   内容: ${match.content.substring(0, 80)}...\n`);
  });

  // 3. BtoBのみフィルタリング
  const btobMatches = allMatches?.filter((m: any) => m.metadata.category === 'BtoB');
  console.log(`\n=== BtoBのみ（上位10件） ===`);
  console.log(`BtoB検索結果: ${btobMatches?.length}件\n`);

  btobMatches?.slice(0, 10).forEach((match: any, i: number) => {
    console.log(`${i + 1}. ${match.metadata.sheetName} - ${match.metadata.type}`);
    console.log(`   類似度: ${(match.similarity * 100).toFixed(1)}%`);
    console.log(`   内容: ${match.content.substring(0, 80)}...\n`);
  });

  // 4. survey/question除外後
  const filteredMatches = btobMatches?.filter(
    (m: any) => m.metadata.type !== 'survey' && m.metadata.type !== 'question'
  );

  console.log(`\n=== survey/question除外後（上位10件） ===`);
  console.log(`フィルタ後結果: ${filteredMatches?.length}件\n`);

  filteredMatches?.slice(0, 10).forEach((match: any, i: number) => {
    console.log(`${i + 1}. ${match.metadata.sheetName} - ${match.metadata.type}`);
    console.log(`   類似度: ${(match.similarity * 100).toFixed(1)}%`);
    console.log(`   内容: ${match.content.substring(0, 80)}...\n`);
  });

  // 5. 「ソリューションセールス」を含むものを探す
  const withKeyword = filteredMatches?.filter((m: any) =>
    m.content.includes('ソリューションセールス') || m.context?.includes('ソリューションセールス')
  );

  console.log(`\n=== 「ソリューションセールス」を含む結果 ===`);
  console.log(`該当件数: ${withKeyword?.length || 0}件\n`);

  withKeyword?.forEach((match: any, i: number) => {
    console.log(`${i + 1}. ${match.metadata.sheetName} - ${match.metadata.type}`);
    console.log(`   類似度: ${(match.similarity * 100).toFixed(1)}%`);
    console.log(`   内容: ${match.content}\n`);
  });
}

testSolutionSalesVector();
