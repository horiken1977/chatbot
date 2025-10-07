import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';

async function checkSurveyContent() {
  const supabase = getSupabaseAdmin();

  // M6CH03024のsurveyを確認
  const { data: surveys, error } = await supabase
    .from('knowledge_base')
    .select('content, metadata')
    .eq('metadata->>sheetName', 'M6CH03024')
    .eq('metadata->>type', 'survey')
    .limit(5);

  if (error) {
    console.error('エラー:', error);
    return;
  }

  console.log('=== M6CH03024のsurveyコンテンツ ===\n');
  surveys?.forEach((item: any, i: number) => {
    console.log(`${i + 1}. セクション: ${item.metadata.section}`);
    console.log(`   内容: ${item.content}\n`);
  });
}

checkSurveyContent().catch(console.error);
