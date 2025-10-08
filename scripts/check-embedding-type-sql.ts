import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import pg from 'pg';
const { Client } = pg;

async function checkEmbeddingType() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('データベース接続成功\n');

    // 1. テーブルスキーマ確認
    console.log('=== テーブルスキーマ ===\n');
    const schemaResult = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'knowledge_base'
        AND column_name = 'embedding';
    `);
    console.log('Embedding column:', schemaResult.rows[0]);
    console.log();

    // 2. TEST_NEWのembedding型確認
    console.log('=== TEST_NEWのembedding型 ===\n');
    const typeResult = await client.query(`
      SELECT
        sheet_name,
        pg_typeof(embedding) as embedding_type,
        substring(embedding::text, 1, 100) as embedding_sample
      FROM knowledge_base
      WHERE sheet_name = 'TEST_NEW'
      LIMIT 1;
    `);
    if (typeResult.rows.length > 0) {
      console.log('Sheet:', typeResult.rows[0].sheet_name);
      console.log('Type:', typeResult.rows[0].embedding_type);
      console.log('Sample:', typeResult.rows[0].embedding_sample);
      console.log();
    } else {
      console.log('TEST_NEWが見つかりません\n');
    }

    // 3. 既存データのembedding型確認
    console.log('=== 既存データのembedding型（サンプル） ===\n');
    const existingResult = await client.query(`
      SELECT
        sheet_name,
        pg_typeof(embedding) as embedding_type,
        substring(embedding::text, 1, 100) as embedding_sample
      FROM knowledge_base
      WHERE sheet_name LIKE 'B6CH%'
      LIMIT 3;
    `);
    existingResult.rows.forEach((row, i) => {
      console.log(`${i + 1}. Sheet: ${row.sheet_name}`);
      console.log(`   Type: ${row.embedding_type}`);
      console.log(`   Sample: ${row.embedding_sample}`);
      console.log();
    });

    // 4. ベクトル演算テスト
    console.log('=== ベクトル演算テスト ===\n');
    const vectorTestResult = await client.query(`
      SELECT
        sheet_name,
        embedding <=> '[0.1,0.2,0.3]'::vector AS distance
      FROM knowledge_base
      WHERE sheet_name = 'TEST_NEW'
      LIMIT 1;
    `);

    if (vectorTestResult.rows.length > 0) {
      console.log('Distance calculation:', vectorTestResult.rows[0]);
      console.log('Success! Embedding is stored as vector type\n');
    } else {
      console.log('TEST_NEWが見つかりません\n');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkEmbeddingType();
