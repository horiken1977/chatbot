import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';

async function checkEmbeddings() {
  const supabase = getSupabaseAdmin();

  console.log('=== データベースの埋め込みベクトル検証 ===\n');

  // サンプルデータを取得
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('id, content, embedding, metadata')
    .eq('metadata->>category', 'BtoB')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`サンプル数: ${data?.length}件\n`);

  data?.forEach((row, i) => {
    console.log(`${i + 1}. ID: ${row.id}`);
    console.log(`   Sheet: ${row.metadata.sheetName}`);
    console.log(`   Content: ${row.content.substring(0, 50)}...`);
    console.log(`   Embedding型: ${typeof row.embedding}`);
    console.log(`   Embedding値: ${JSON.stringify(row.embedding).substring(0, 100)}...`);

    if (Array.isArray(row.embedding)) {
      console.log(`   Embedding配列長: ${row.embedding.length}`);
      const firstFew = row.embedding.slice(0, 5);
      console.log(`   最初の5要素: ${firstFew}`);
      const sum = row.embedding.reduce((a: number, b: number) => a + Math.abs(b), 0);
      console.log(`   絶対値合計: ${sum.toFixed(3)}`);
    } else if (typeof row.embedding === 'string') {
      console.log(`   String長: ${row.embedding.length}`);
      console.log(`   最初の100文字: ${row.embedding.substring(0, 100)}`);
    }
    console.log();
  });

  // ベクトルがnullまたは異常な値のレコードを確認
  const { count: nullCount } = await supabase
    .from('knowledge_base')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null);

  console.log(`埋め込みがnullのレコード数: ${nullCount}件\n`);

  // 「ソリューションセールス」を含むレコードのembeddingを確認
  const { data: solutionData } = await supabase
    .from('knowledge_base')
    .select('id, content, embedding, metadata')
    .eq('metadata->>category', 'BtoB')
    .ilike('content', '%ソリューションセールス%')
    .limit(2);

  console.log(`\n=== 「ソリューションセールス」を含むレコード ===\n`);
  solutionData?.forEach((row, i) => {
    console.log(`${i + 1}. Sheet: ${row.metadata.sheetName}`);
    console.log(`   Content: ${row.content.substring(0, 100)}...`);
    console.log(`   Embedding型: ${typeof row.embedding}`);

    if (Array.isArray(row.embedding)) {
      console.log(`   Embedding配列長: ${row.embedding.length}`);
      const sum = row.embedding.reduce((a: number, b: number) => a + Math.abs(b), 0);
      console.log(`   絶対値合計: ${sum.toFixed(3)}`);
    }
    console.log();
  });
}

checkEmbeddings();
