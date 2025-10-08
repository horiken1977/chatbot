import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';

async function checkColumnType() {
  const supabase = getSupabaseAdmin();

  console.log('=== knowledge_baseテーブルの列情報 ===\n');

  // PostgreSQLの列情報を取得
  const { data, error } = await supabase.rpc('get_column_info' as any);

  if (error) {
    // 関数が存在しない場合は直接クエリ
    console.log('直接SQLを実行します...\n');

    const { data: columns, error: sqlError } = await supabase
      .from('information_schema.columns' as any)
      .select('column_name, data_type, udt_name')
      .eq('table_name', 'knowledge_base')
      .eq('table_schema', 'public');

    if (sqlError) {
      console.error('Error:', sqlError);

      // 代わりにサンプルデータの型を確認
      console.log('\nサンプルデータから型を推定...\n');
      const { data: sample } = await supabase
        .from('knowledge_base')
        .select('*')
        .limit(1)
        .single();

      if (sample) {
        console.log('Columns:');
        Object.entries(sample).forEach(([key, value]) => {
          console.log(`  ${key}: ${typeof value} (${value === null ? 'null' : Array.isArray(value) ? `array[${value.length}]` : typeof value})`);
        });
      }
    } else {
      console.log('Columns:', columns);
    }
  } else {
    console.log('Column info:', data);
  }

  // embedding列が正しくvector型として認識されているか確認
  const { data: embeddingCheck, error: checkError } = await supabase.rpc(
    'pg_typeof' as any,
    { col: 'embedding' }
  );

  if (!checkError && embeddingCheck) {
    console.log('\nEmbedding column type:', embeddingCheck);
  }
}

checkColumnType();
