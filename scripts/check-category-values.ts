import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';

async function checkCategoryValues() {
  const supabase = getSupabaseAdmin();

  // カテゴリ値のユニークな一覧を取得
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('metadata')
    .limit(100);

  if (error) {
    console.error('エラー:', error);
    return;
  }

  const categorySet = new Set<string>();
  data?.forEach((row: any) => {
    if (row.metadata?.category) {
      categorySet.add(row.metadata.category);
    }
  });

  console.log('=== データベース内のカテゴリ値 ===');
  Array.from(categorySet).forEach((cat) => {
    console.log(`- "${cat}"`);
  });

  // 各カテゴリの件数を確認
  console.log('\n=== カテゴリ別の件数 ===');
  for (const cat of Array.from(categorySet)) {
    const { data: catData, error: catError } = await supabase
      .from('knowledge_base')
      .select('id', { count: 'exact', head: true })
      .eq('metadata->>category', cat);

    if (!catError && catData !== null) {
      console.log(`${cat}: ${catData.length}件`);
    }
  }
}

checkCategoryValues().catch(console.error);
