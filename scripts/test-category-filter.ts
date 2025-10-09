import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';
import { generateEmbedding } from '../src/lib/gemini';

async function testCategoryFilter() {
  console.log('Testing match_knowledge_by_category function\n');

  // BtoB関連の質問でテスト
  const query = "ソリューションセールスの概要について教えて下さい";
  console.log('Query:', query);

  const embedding = await generateEmbedding(query);
  console.log('✅ Embedding generated, length:', embedding.length);

  const supabase = getSupabaseAdmin();
  const vectorString = `[${embedding.join(',')}]`;

  // 1. BtoBでフィルタ
  console.log('\n' + '='.repeat(60));
  console.log('Test 1: Filter by BtoB category');
  console.log('='.repeat(60));

  const { data: btobData, error: btobError } = await supabase.rpc('match_knowledge_by_category', {
    query_embedding: vectorString,
    filter_category: 'BtoB',
    match_threshold: 0.3,
    match_count: 10,
  });

  if (btobError) {
    console.error('❌ Error:', btobError);
  } else {
    console.log(`✅ Found ${btobData?.length || 0} BtoB matches`);
    if (btobData && btobData.length > 0) {
      console.log('\nTop 3 results:');
      btobData.slice(0, 3).forEach((match: any, i: number) => {
        console.log(`\n${i + 1}. Sheet: ${match.sheet_name}`);
        console.log(`   Category: ${match.category}`);
        console.log(`   Similarity: ${match.similarity.toFixed(3)}`);
        console.log(`   Content: ${match.content.substring(0, 100)}...`);
      });
    }
  }

  // 2. BtoCでフィルタ
  console.log('\n' + '='.repeat(60));
  console.log('Test 2: Filter by BtoC category');
  console.log('='.repeat(60));

  const { data: btocData, error: btocError } = await supabase.rpc('match_knowledge_by_category', {
    query_embedding: vectorString,
    filter_category: 'BtoC',
    match_threshold: 0.3,
    match_count: 10,
  });

  if (btocError) {
    console.error('❌ Error:', btocError);
  } else {
    console.log(`✅ Found ${btocData?.length || 0} BtoC matches`);
    if (btocData && btocData.length > 0) {
      console.log('\nTop 3 results:');
      btocData.slice(0, 3).forEach((match: any, i: number) => {
        console.log(`\n${i + 1}. Sheet: ${match.sheet_name}`);
        console.log(`   Category: ${match.category}`);
        console.log(`   Similarity: ${match.similarity.toFixed(3)}`);
        console.log(`   Content: ${match.content.substring(0, 100)}...`);
      });
    }
  }

  // 3. 旧関数との比較
  console.log('\n' + '='.repeat(60));
  console.log('Test 3: Compare with old function (match_knowledge)');
  console.log('='.repeat(60));

  const { data: oldData, error: oldError } = await supabase.rpc('match_knowledge', {
    query_embedding: vectorString,
    match_threshold: 0.3,
    match_count: 50,
  });

  if (oldError) {
    console.error('❌ Error:', oldError);
  } else {
    const categoryCounts: Record<string, number> = { BtoB: 0, BtoC: 0 };
    (oldData || []).forEach((match: any) => {
      if (match.category === 'BtoB') categoryCounts.BtoB++;
      if (match.category === 'BtoC') categoryCounts.BtoC++;
    });

    console.log('Old function (match_knowledge) results:');
    console.log(`  Total: ${oldData?.length || 0}`);
    console.log(`  BtoB: ${categoryCounts.BtoB}`);
    console.log(`  BtoC: ${categoryCounts.BtoC}`);
    console.log('\nNew function results:');
    console.log(`  BtoB only: ${btobData?.length || 0}`);
    console.log(`  BtoC only: ${btocData?.length || 0}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed');
  console.log('='.repeat(60));
}

testCategoryFilter();
