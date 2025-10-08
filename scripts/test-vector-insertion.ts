import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';
import { generateEmbedding } from '../src/lib/gemini';

async function testVectorInsertion() {
  const supabase = getSupabaseAdmin();

  console.log('=== ベクトル挿入テスト ===\n');

  // テストデータ
  const testContent = 'これはテストデータです。ソリューションセールスについて説明します。';

  // 1. 埋め込み生成
  console.log('埋め込み生成中...');
  const embedding = await generateEmbedding(testContent);
  console.log(`埋め込み生成完了: ${embedding.length}次元\n`);

  // 2. 旧形式（配列）で挿入
  console.log('旧形式（配列）で挿入テスト...');
  const { data: oldData, error: oldError } = await supabase
    .from('knowledge_base')
    .insert([
      {
        category: 'BtoB',
        sheet_name: 'TEST_OLD',
        content: testContent,
        context: null,
        metadata: { test: true, format: 'array' },
        embedding: embedding, // 配列のまま
      },
    ])
    .select();

  if (oldError) {
    console.error('旧形式エラー:', oldError);
  } else {
    console.log(`旧形式挿入成功: ${oldData?.length}件\n`);
  }

  // 3. 新形式（文字列）で挿入
  console.log('新形式（文字列）で挿入テスト...');
  const embeddingString = `[${embedding.join(',')}]`;
  const { data: newData, error: newError } = await supabase
    .from('knowledge_base')
    .insert([
      {
        category: 'BtoB',
        sheet_name: 'TEST_NEW',
        content: testContent,
        context: null,
        metadata: { test: true, format: 'string' },
        embedding: embeddingString, // 文字列形式
      },
    ])
    .select();

  if (newError) {
    console.error('新形式エラー:', newError);
  } else {
    console.log(`新形式挿入成功: ${newData?.length}件\n`);
  }

  // 4. ベクトル検索テスト
  console.log('ベクトル検索テスト...');
  const queryEmbedding = await generateEmbedding('ソリューションセールスとは何ですか？');

  const { data: searchResults, error: searchError } = await supabase.rpc('match_knowledge', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_threshold: 0.1,
    match_count: 5,
  });

  if (searchError) {
    console.error('検索エラー:', searchError);
  } else {
    console.log(`検索結果: ${searchResults?.length}件\n`);
    const testResults = searchResults?.filter((r: any) => r.sheet_name.startsWith('TEST_'));
    console.log(`テストデータの検索結果: ${testResults?.length}件\n`);

    testResults?.forEach((result: any, i: number) => {
      console.log(`${i + 1}. ${result.sheet_name} (format: ${result.metadata.format})`);
      console.log(`   類似度: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`   内容: ${result.content}\n`);
    });

    // 全体結果も表示
    console.log('全体検索結果（上位5件）:');
    searchResults?.slice(0, 5).forEach((result: any, i: number) => {
      console.log(`${i + 1}. ${result.sheet_name}`);
      console.log(`   類似度: ${(result.similarity * 100).toFixed(1)}%\n`);
    });
  }

  // 5. テストデータ削除（コメントアウト - 手動確認のため）
  // console.log('テストデータ削除中...');
  // const { error: deleteError } = await supabase
  //   .from('knowledge_base')
  //   .delete()
  //   .in('sheet_name', ['TEST_OLD', 'TEST_NEW']);

  // if (deleteError) {
  //   console.error('削除エラー:', deleteError);
  // } else {
  //   console.log('テストデータ削除完了\n');
  // }
}

testVectorInsertion();
