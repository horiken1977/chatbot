import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';

async function searchSolutionSales() {
  const supabase = getSupabaseAdmin();

  console.log('=== BtoBデータで「ソリューションセールス」を検索 ===\n');

  // まずBtoBデータの総数を確認
  const { count: totalCount } = await supabase
    .from('knowledge_base')
    .select('*', { count: 'exact', head: true })
    .eq('metadata->>category', 'BtoB');

  console.log(`BtoBデータ総数: ${totalCount}件\n`);

  // content列で検索
  const { data: contentResults, error: contentError } = await supabase
    .from('knowledge_base')
    .select('content, metadata')
    .eq('metadata->>category', 'BtoB')
    .ilike('content', '%ソリューションセールス%')
    .limit(10);

  if (contentError) {
    console.error('Content検索エラー:', contentError);
  } else {
    console.log(`Content列での検索結果: ${contentResults?.length || 0}件\n`);
    contentResults?.forEach((row, i) => {
      console.log(`${i + 1}. Sheet: ${row.metadata.sheetName}`);
      console.log(`   Content: ${row.content.substring(0, 100)}...\n`);
    });
  }

  // context列で検索
  const { data: contextResults, error: contextError } = await supabase
    .from('knowledge_base')
    .select('context, metadata')
    .eq('metadata->>category', 'BtoB')
    .ilike('context', '%ソリューションセールス%')
    .limit(10);

  if (contextError) {
    console.error('Context検索エラー:', contextError);
  } else {
    console.log(`Context列での検索結果: ${contextResults?.length || 0}件\n`);
    contextResults?.forEach((row, i) => {
      console.log(`${i + 1}. Sheet: ${row.metadata.sheetName}`);
      console.log(`   Context: ${row.context?.substring(0, 100)}...\n`);
    });
  }
}

searchSolutionSales();
