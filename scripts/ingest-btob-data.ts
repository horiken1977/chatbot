/**
 * BtoBデータ取り込みスクリプト
 *
 * Google Sheets（BtoB用スプレッドシート）からデータを取得し、クリーニング・チャンク分割・埋め込み生成を行い、
 * Supabaseのknowledge_baseテーブルに保存する
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// .env.localを読み込む
config({ path: resolve(__dirname, '../.env.local') });

// BtoB用のスプレッドシートIDを設定
process.env.GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_BTOB_SPREADSHEET_ID;

import { getSupabaseAdmin } from '../src/lib/supabase';
import { generateBtoBSheetNames, getSheetData, getCategoryFromSheetName } from '../src/lib/google-sheets';
import { createChunksFromSheet, getChunkStats } from '../src/lib/chunker';
import { generateEmbeddingsBatch } from '../src/lib/gemini';
import type { Chunk } from '../src/lib/chunker';

interface IngestionOptions {
  startSheet?: number;
  endSheet?: number;
  batchSize?: number;
  delayMs?: number;
  dryRun?: boolean;
}

interface IngestionStats {
  totalSheets: number;
  processedSheets: number;
  failedSheets: number;
  totalChunks: number;
  insertedChunks: number;
  failedChunks: number;
  startTime: Date;
  endTime?: Date;
  errors: Array<{ sheet: string; error: string }>;
}

/**
 * メイン処理
 */
async function ingestData(options: IngestionOptions = {}) {
  const {
    startSheet = 1,
    endSheet = 185,
    batchSize = 10,
    delayMs = 2000,
    dryRun = false,
  } = options;

  const stats: IngestionStats = {
    totalSheets: endSheet - startSheet + 1,
    processedSheets: 0,
    failedSheets: 0,
    totalChunks: 0,
    insertedChunks: 0,
    failedChunks: 0,
    startTime: new Date(),
    errors: [],
  };

  console.log('='.repeat(80));
  console.log('BtoBデータ取り込み開始');
  console.log('='.repeat(80));
  console.log(`対象シート: B6CH01000 〜 B6CH06033`);
  console.log(`総シート数: ${stats.totalSheets}`);
  console.log(`バッチサイズ: ${batchSize}シート/バッチ`);
  console.log(`ドライラン: ${dryRun ? 'Yes' : 'No'}`);
  console.log('='.repeat(80));
  console.log();

  try {
    const supabase = getSupabaseAdmin();
    const sheetNames = generateBtoBSheetNames(startSheet, endSheet);

    // バッチ単位で処理
    for (let i = 0; i < sheetNames.length; i += batchSize) {
      const batchSheets = sheetNames.slice(i, Math.min(i + batchSize, sheetNames.length));
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(sheetNames.length / batchSize);

      console.log(`\n📦 バッチ ${batchNum}/${totalBatches} (${batchSheets.length}シート)`);
      console.log('-'.repeat(80));

      for (const sheetName of batchSheets) {
        try {
          console.log(`\n📄 処理中: ${sheetName}`);

          // 1. シートデータ取得
          console.log('  📥 データ取得中...');
          const rows = await getSheetData(sheetName);
          console.log(`  ✅ ${rows.length}行取得`);

          if (rows.length === 0) {
            console.log('  ⏭️  空シートのためスキップ');
            stats.processedSheets++;
            continue;
          }

          // 2. チャンク生成
          console.log('  🔄 チャンク生成中...');
          const chunks = createChunksFromSheet(rows, sheetName);
          const chunkStats = getChunkStats(chunks);
          console.log(`  ✅ ${chunks.length}チャンク生成（平均${chunkStats.averageTokens}トークン）`);

          if (chunks.length === 0) {
            console.log('  ⏭️  有効なチャンクがないためスキップ');
            stats.processedSheets++;
            continue;
          }

          stats.totalChunks += chunks.length;

          // 3. 埋め込み生成
          console.log('  🤖 埋め込み生成中...');
          const texts = chunks.map((chunk) => chunk.content);
          const embeddings = await generateEmbeddingsBatch(texts, (current, total) => {
            process.stdout.write(`\r  🤖 埋め込み生成中: ${current}/${total}`);
          });
          console.log('\n  ✅ 埋め込み生成完了');

          // 4. データベース挿入
          if (!dryRun) {
            console.log('  💾 データベース挿入中...');
            const category = getCategoryFromSheetName(sheetName);

            const insertData = chunks.map((chunk, index) => ({
              category,
              sheet_name: sheetName,
              row_number: null, // チャンクの場合はnull
              content: chunk.content,
              context: chunk.context,
              metadata: chunk.metadata,
              embedding: `[${embeddings[index].join(',')}]`, // vector型の文字列表現に変換
            }));

            const { data, error } = await supabase.from('knowledge_base').insert(insertData).select();

            if (error) {
              throw new Error(`Database insert failed: ${error.message}`);
            }

            console.log(`  ✅ ${data?.length || 0}件挿入完了`);
            stats.insertedChunks += data?.length || 0;
          } else {
            console.log('  ⏭️  ドライランのため挿入スキップ');
          }

          stats.processedSheets++;
        } catch (error) {
          stats.failedSheets++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          stats.errors.push({ sheet: sheetName, error: errorMessage });
          console.error(`  ❌ エラー: ${errorMessage}`);
        }
      }

      // バッチ間の待機
      if (i + batchSize < sheetNames.length && delayMs > 0) {
        console.log(`\n⏳ 次のバッチまで ${delayMs / 1000}秒待機中...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    stats.endTime = new Date();

    // 結果サマリー
    console.log('\n');
    console.log('='.repeat(80));
    console.log('取り込み完了');
    console.log('='.repeat(80));
    console.log(`処理シート数: ${stats.processedSheets}/${stats.totalSheets}`);
    console.log(`失敗シート数: ${stats.failedSheets}`);
    console.log(`総チャンク数: ${stats.totalChunks}`);
    console.log(`挿入チャンク数: ${stats.insertedChunks}`);
    console.log(`失敗チャンク数: ${stats.failedChunks}`);

    const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;
    console.log(`処理時間: ${Math.floor(duration / 60)}分${Math.floor(duration % 60)}秒`);

    if (stats.errors.length > 0) {
      console.log('\nエラー一覧:');
      stats.errors.forEach(({ sheet, error }) => {
        console.log(`  ${sheet}: ${error}`);
      });
    }

    console.log('='.repeat(80));

    return stats;
  } catch (error) {
    console.error('\n❌ 致命的エラー:');
    console.error(error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * コマンドライン引数のパース
 */
function parseArgs(): IngestionOptions {
  const args = process.argv.slice(2);
  const options: IngestionOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--start' && args[i + 1]) {
      options.startSheet = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--end' && args[i + 1]) {
      options.endSheet = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--batch-size' && args[i + 1]) {
      options.batchSize = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--delay' && args[i + 1]) {
      options.delayMs = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--help') {
      console.log(`
使用方法:
  npm run ingest [オプション]

オプション:
  --start <番号>       開始シート番号（デフォルト: 1）
  --end <番号>         終了シート番号（デフォルト: 182）
  --batch-size <数>    バッチサイズ（デフォルト: 10）
  --delay <ミリ秒>     バッチ間の待機時間（デフォルト: 2000）
  --dry-run            ドライラン（データベースに挿入しない）
  --help               このヘルプを表示

例:
  # 最初の10シートだけテスト
  npm run ingest -- --start 1 --end 10 --dry-run

  # 11〜20シートを処理
  npm run ingest -- --start 11 --end 20

  # 全シート処理（バッチサイズ5、待機時間3秒）
  npm run ingest -- --batch-size 5 --delay 3000
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * エントリーポイント
 */
if (require.main === module) {
  const options = parseArgs();

  ingestData(options)
    .then((stats) => {
      if (stats.failedSheets > 0) {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { ingestData, type IngestionOptions, type IngestionStats };
