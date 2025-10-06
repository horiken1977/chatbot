/**
 * テキストクリーニングのテストスクリプト
 *
 * 1シート分のデータを取得してクリーニングをテスト
 */

// 最初にdotenvで環境変数をロード
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

const TEST_SHEET_NAME = 'M6CH01001';

async function main() {
  // 環境変数ロード後に動的インポート
  const { getSheetData, getSheetDataStats } = await import('../src/lib/google-sheets');
  const { cleanText, processContentByType, cleaningDiff, isValidContent } = await import('../src/lib/text-cleaner');
  const { createChunksFromSheet, getChunkStats } = await import('../src/lib/chunker');

  console.log('='.repeat(80));
  console.log('テキストクリーニングテスト');
  console.log('='.repeat(80));
  console.log();

  try {
    // 1. シートデータを取得
    console.log(`📥 シート取得中: ${TEST_SHEET_NAME}`);
    const rows = await getSheetData(TEST_SHEET_NAME);
    console.log(`✅ ${rows.length}行取得しました`);
    console.log();

    // 2. シート統計情報
    const stats = getSheetDataStats(TEST_SHEET_NAME, rows);
    console.log('📊 シート統計:');
    console.log(`  総行数: ${stats.totalRows}`);
    console.log(`  有効行数: ${stats.validRows}`);
    console.log(`  空行数: ${stats.emptyRows}`);
    console.log(`  セクション: ${Array.from(stats.sections).join(', ')}`);
    console.log(`  タイプ: ${Array.from(stats.types).join(', ')}`);
    console.log();

    // 3. クリーニングテスト（最初の3行）
    console.log('🧹 クリーニングテスト（最初の3行）:');
    console.log('-'.repeat(80));

    for (let i = 0; i < Math.min(3, rows.length); i++) {
      const row = rows[i];
      console.log(`\n[${i + 1}] ${row.message_id} (${row.type})`);
      console.log();

      const diff = cleaningDiff(row.contents);

      console.log('Before:');
      console.log(diff.before.substring(0, 200) + (diff.before.length > 200 ? '...' : ''));
      console.log();

      console.log('After:');
      console.log(diff.after.substring(0, 200) + (diff.after.length > 200 ? '...' : ''));
      console.log();

      console.log('変更内容:');
      diff.changes.forEach((change) => console.log(`  - ${change}`));
      console.log();

      const isValid = isValidContent(diff.after);
      console.log(`有効なコンテンツ: ${isValid ? '✅' : '❌'}`);
      console.log('-'.repeat(80));
    }

    // 4. タイプ別処理テスト
    console.log('\n🔄 タイプ別処理テスト:');
    console.log('-'.repeat(80));

    const typeExamples = rows
      .filter((row) => row.type)
      .reduce(
        (acc, row) => {
          if (!acc[row.type]) {
            acc[row.type] = row;
          }
          return acc;
        },
        {} as Record<string, (typeof rows)[0]>
      );

    Object.entries(typeExamples).forEach(([type, row]) => {
      console.log(`\n[${type}]`);
      const processed = processContentByType(row.contents, row.type, row.choices, row.correct_answer);
      console.log(processed.substring(0, 150) + (processed.length > 150 ? '...' : ''));
    });
    console.log('-'.repeat(80));

    // 5. チャンク生成テスト
    console.log('\n📦 チャンク生成テスト:');
    console.log('-'.repeat(80));

    const chunks = createChunksFromSheet(rows, TEST_SHEET_NAME);
    const chunkStats = getChunkStats(chunks);

    console.log(`総チャンク数: ${chunkStats.totalChunks}`);
    console.log(`平均トークン数: ${chunkStats.averageTokens}`);
    console.log(`最大トークン数: ${chunkStats.maxTokens}`);
    console.log(`最小トークン数: ${chunkStats.minTokens}`);
    console.log(`空チャンク数: ${chunkStats.emptyChunks}`);
    console.log();

    console.log('セクション別チャンク数:');
    Object.entries(chunkStats.bySection)
      .sort(([, a], [, b]) => b - a)
      .forEach(([section, count]) => {
        console.log(`  ${section}: ${count}`);
      });
    console.log();

    console.log('タイプ別チャンク数:');
    Object.entries(chunkStats.byType)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    console.log();

    // 6. サンプルチャンクの表示
    console.log('サンプルチャンク（最初の2個）:');
    console.log('-'.repeat(80));

    chunks.slice(0, 2).forEach((chunk, index) => {
      console.log(`\n[チャンク ${index + 1}]`);
      console.log(`セクション: ${chunk.metadata.section}`);
      console.log(`タイプ: ${chunk.metadata.type}`);
      console.log(`メッセージID: ${chunk.metadata.messageId}`);
      console.log();
      console.log('コンテンツ:');
      console.log(chunk.content);
      console.log();
      console.log('文脈:');
      console.log(chunk.context || '(なし)');
      console.log('-'.repeat(80));
    });

    console.log('\n✅ テスト完了！');
  } catch (error) {
    console.error('\n❌ エラーが発生しました:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
