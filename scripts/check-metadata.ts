import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';

async function checkMetadata() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('knowledge_base').select('metadata').limit(3);

  console.log('=== メタデータ構造（最初の3件） ===\n');
  data?.forEach((row: any, i: number) => {
    console.log(`${i + 1}. ${JSON.stringify(row.metadata, null, 2)}\n`);
  });
}

checkMetadata().catch(console.error);
