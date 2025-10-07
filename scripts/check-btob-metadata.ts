import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';

async function checkBtoBMetadata() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('knowledge_base')
    .select('metadata')
    .ilike('metadata->>sheetName', 'B6CH%')
    .limit(3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== BtoBメタデータ（最初の3件） ===\n');
  data.forEach((row, i) => {
    console.log(`${i + 1}. ${JSON.stringify(row.metadata, null, 2)}\n`);
  });
}

checkBtoBMetadata();
