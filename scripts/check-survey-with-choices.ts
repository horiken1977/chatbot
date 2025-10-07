import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase';

async function checkSurveyWithChoices() {
  const supabase = getSupabaseAdmin();

  // surveyタイプのデータを確認
  const { data: surveys, error } = await supabase
    .from('knowledge_base')
    .select('content, metadata')
    .eq('metadata->>type', 'survey')
    .limit(5);

  if (error) {
    console.error('エラー:', error);
    return;
  }

  console.log('=== Survey タイプのコンテンツ（最初の5件） ===\n');
  surveys?.forEach((item: any, i: number) => {
    console.log(`${i + 1}. ${item.metadata.sheetName} - ${item.metadata.section}`);
    console.log(`   hasChoices: ${item.metadata.hasChoices}`);
    console.log(`   内容:\n${item.content.substring(0, 300)}\n`);
  });
}

checkSurveyWithChoices().catch(console.error);
