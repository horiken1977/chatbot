import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';

async function checkContentTypes() {
  const supabase = getSupabaseAdmin();

  // タイプ別の件数を取得
  const { data: typeCounts, error: typeError } = await supabase
    .from('knowledge_base')
    .select('metadata')
    .limit(10000);

  if (typeError) {
    console.error('エラー:', typeError);
    return;
  }

  const typeMap = new Map<string, number>();
  typeCounts?.forEach((row: any) => {
    const type = row.metadata?.type || 'unknown';
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  });

  console.log('\n=== コンテンツタイプ別の件数 ===\n');
  Array.from(typeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`${type}: ${count}件`);
    });

  // 「売れ続ける」を含むコンテンツを検索
  const { data: matches, error: searchError } = await supabase
    .from('knowledge_base')
    .select('content, metadata')
    .ilike('content', '%売れ続ける%')
    .limit(10);

  if (searchError) {
    console.error('検索エラー:', searchError);
    return;
  }

  console.log(`\n\n=== "売れ続ける"を含むコンテンツ（${matches?.length || 0}件） ===\n`);
  matches?.forEach((match: any, i: number) => {
    console.log(`${i + 1}. ${match.metadata.sheetName} - ${match.metadata.type}`);
    console.log(`   ${match.content.substring(0, 200)}...\n`);
  });
}

checkContentTypes().catch(console.error);
