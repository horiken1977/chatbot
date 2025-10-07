import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';

async function deleteAllData() {
  const supabase = getSupabaseAdmin();

  console.log('既存データを削除中...');

  // 全データを削除
  const { error } = await supabase
    .from('knowledge_base')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // 全レコード削除

  if (error) {
    console.error('削除エラー:', error);
    return;
  }

  console.log('✅ 全データを削除しました');

  // 確認
  const { count } = await supabase
    .from('knowledge_base')
    .select('id', { count: 'exact', head: true });

  console.log(`残りレコード数: ${count || 0}件`);
}

deleteAllData().catch(console.error);
