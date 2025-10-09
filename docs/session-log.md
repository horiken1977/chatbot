# 開発セッションログ

> このファイルは、各開発セッションの記録を残すためのものです。
> VSCode/Claude Codeのクラッシュ時の復旧に使用します。

---

## 2025-10-05

### セッション1: プロジェクト初期セットアップ

#### 実施内容
1. **要件定義**
   - マーケティングナレッジチャットボットの要件整理
   - BtoB/BtoC分離の確認
   - RAG方式の採用決定

2. **技術選定**
   - Next.js 15 + TypeScript
   - Supabase (PostgreSQL + pgvector)
   - Gemini API
   - Vercel Hobby環境

3. **ドキュメント作成**
   - ✅ `docs/requirements.md` - 要件定義書
   - ✅ `docs/architecture.md` - アーキテクチャ設計書
   - ✅ `docs/development-plan.md` - 開発計画書
   - ✅ `docs/directory-structure.md` - ディレクトリ構成案

4. **プロジェクトセットアップ**
   - ✅ ディレクトリ構造作成
   - ✅ Next.js 15プロジェクト初期化
   - ✅ TypeScript設定
   - ✅ Tailwind CSS v4設定
   - ✅ ESLint設定

5. **基本UI実装**
   - ✅ ポータルページ（BtoB/BtoC選択）
   - ✅ チャットページの骨組み
   - ✅ レスポンシブデザイン

6. **開発ガイドライン整備**
   - ✅ `docs/development-guidelines.md` - 開発プロセスガイドライン
   - ✅ `docs/impact-analysis/TEMPLATE.md` - 影響範囲分析テンプレート
   - ✅ `docs/environment-variables.md` - 環境変数管理ドキュメント
   - ✅ `docs/session-log.md` - セッションログ（本ファイル）

#### 動作確認
- ✅ `npm run dev` で開発サーバー起動成功
- ✅ ポータルページ表示確認
- ✅ BtoB/BtoC選択画面表示確認

#### 次のステップ
- Supabaseプロジェクト作成
- ベクトルDBの構築
- Google Sheets API設定
- データ取得スクリプト作成

#### 重要な決定事項
- Tailwind CSS v4を採用（`@tailwindcss/postcss`使用）
- Vercel Hobby環境で無料運用を目指す
- Supabase無料枠で開始

#### 問題と解決
1. **問題**: Tailwind CSS v4のPostCSS設定エラー
   - **解決**: `@tailwindcss/postcss`をインストールし、`postcss.config.mjs`を更新

#### 環境変数
- `.env.example` 作成済み
- ローカル環境用の `.env.local` は未作成（次セッションで実施）

---

### セッション2: Supabaseセットアップと環境変数設定

#### 実施日時
- 2025-10-05 09:00 - 12:45

#### 実施内容
1. **MCP サーバー設定強化**
   - ✅ Serena MCP サーバー追加（`serena-chatbot`）
   - ✅ `CLAUDE.md` 作成（人間が読みやすいガイド）
   - ✅ `.clauderc` 作成（自動読み込み設定）
   - ✅ `.clinerules` 作成（コーディング規約）
   - ✅ `docs/mcp-usage-guide.md` 作成
   - ✅ `docs/auto-recovery-setup.md` 作成
   - ✅ `docs/file-structure-guide.md` 作成

2. **Supabase セットアップ**
   - ✅ 影響範囲分析作成（`docs/impact-analysis/2025-10-05_supabase-setup.md`）
   - ✅ セットアップガイド作成（`docs/supabase-setup.md`）
   - ✅ データベースマイグレーション作成（`supabase/migrations/001_initial_schema.sql`）
     - `knowledge_base` テーブル（ベクトルストア、768次元）
     - `chat_history` テーブル（チャット履歴）
     - ベクトル検索関数 `search_knowledge()`
   - ✅ Supabaseクライアント設定（`src/lib/supabase.ts`）
   - ✅ 型定義作成（`src/types/knowledge.ts`, `src/types/chat.ts`）
   - ✅ `@supabase/supabase-js` インストール

3. **Google Sheets API 設定**
   - ✅ セットアップガイド作成（`docs/google-sheets-api-setup.md`）
   - ✅ APIキー取得方法の詳細説明
   - ✅ サービスアカウント方式の説明

4. **環境変数管理**
   - ✅ 環境変数管理モジュール作成（`src/lib/env.ts`）
   - ✅ 環境変数テストAPI作成（`src/app/api/test-env/route.ts`）
   - ✅ `.env.local` 設定完了
   - ✅ 全環境変数の動作確認完了

#### 動作確認
- ✅ 開発サーバー起動成功
- ✅ 環境変数テストAPI（`/api/test-env`）で全環境変数確認
  - Gemini API Key ✅
  - Supabase URL/Keys ✅
  - Google Sheets API Key ✅

#### 次のステップ
1. **データ取得スクリプト作成**
   - Google Sheets からデータ取得
   - データのクリーニング・構造化
   - チャンク分割

2. **Gemini Embedding API 統合**
   - テキストのベクトル化
   - Supabaseへのデータ投入

3. **RAG機能実装**
   - ベクトル検索
   - Gemini APIで回答生成
   - チャットAPI作成

4. **チャットUI完成**
   - メッセージ表示コンポーネント
   - 入力フォーム
   - 履歴機能

#### 重要な決定事項
- MCP: ハイブリッド方式採用（CLAUDE.md + .clauderc + .clinerules）
- Supabase: 東京リージョン推奨、無料枠で開始
- Google Sheets API: APIキー方式（シンプル）
- データベース: pgvector拡張機能使用、IVFFlatインデックス

#### 問題と解決
なし（スムーズに進行）

#### 変更ファイル
- `~/.claude/config.json` - Serena MCP追加
- `CLAUDE.md` - 新規作成
- `.clauderc` - 新規作成
- `.clinerules` - 新規作成
- `docs/mcp-usage-guide.md` - 新規作成
- `docs/auto-recovery-setup.md` - 新規作成
- `docs/file-structure-guide.md` - 新規作成
- `docs/supabase-setup.md` - 新規作成
- `docs/google-sheets-api-setup.md` - 新規作成
- `docs/impact-analysis/2025-10-05_supabase-setup.md` - 新規作成
- `supabase/migrations/001_initial_schema.sql` - 新規作成
- `src/lib/supabase.ts` - 新規作成
- `src/lib/env.ts` - 新規作成
- `src/types/knowledge.ts` - 新規作成
- `src/types/chat.ts` - 新規作成
- `src/app/api/test-env/route.ts` - 新規作成
- `package.json` - @supabase/supabase-js追加
- `.env.local` - 全環境変数設定完了

---

### セッション3: カテゴリフィルタリングのDB最適化

#### 実施日時
- 2025-10-09 09:00 - 11:00 (クラッシュリカバリー含む)

#### 実施内容
1. **クラッシュからのリカバリー**
   - ✅ session-log.md から前回の作業内容を確認
   - ✅ git status/diff で未コミット変更を確認
   - ✅ 継続中のタスク（カテゴリフィルタDB最適化）を特定

2. **Supabase マイグレーション適用**
   - ✅ マイグレーションファイル作成済み: `003_match_knowledge_by_category.sql`
   - ✅ 新RPC関数 `match_knowledge_by_category` をSupabase SQLエディタで手動適用
   - ✅ カテゴリでフィルタするベクトル検索関数（WHERE句でDB側フィルタ）

3. **チャットAPI更新**
   - ✅ `src/app/api/chat/route.ts` を新RPC関数に切り替え
   - ✅ アプリケーション側フィルタ → DB側フィルタに変更（パフォーマンス改善）
   - ✅ `KnowledgeMatch` インターフェースに `category` フィールド追加

4. **埋め込み生成のエラーハンドリング改善**
   - ✅ `src/lib/gemini.ts`: バッチ処理でのインデックス保持を修正
   - ✅ エラー時は `null` を返す（ゼロベクトルではなく）
   - ✅ `scripts/ingest-data.ts`, `scripts/ingest-btob-data.ts`: null をスキップしてDB挿入

5. **テストスクリプト作成**
   - ✅ `scripts/test-category-filter.ts`: RPC関数の動作確認
   - ✅ `scripts/test-chat-api.ts`: チャットAPIの動作確認

#### 動作確認
- ✅ 新RPC関数 `match_knowledge_by_category` が正常に作成された
- ✅ BtoBフィルタで10件のBtoB専用結果を取得
- ✅ BtoCフィルタで10件のBtoC専用結果を取得
- ✅ チャットAPIがカテゴリ別に正しい情報源から回答生成
- ✅ 全テスト通過

#### 次のステップ
1. **UI改善**（任意）
   - チャット画面の見た目調整
   - ローディング表示の改善
   - エラーメッセージの改善

2. **データ品質向上**（任意）
   - ゼロベクトルや重複embeddingの調査
   - チャンク分割ロジックの改善

3. **デプロイ準備**（今後）
   - Vercel環境へのデプロイ
   - 本番環境テスト

#### 重要な決定事項
- データベースレベルでのカテゴリフィルタリングを採用（パフォーマンス最適化）
- 埋め込み生成失敗時はnullを返し、DB挿入時にスキップする方針

#### 問題と解決
1. **問題**: マイグレーション適用スクリプトが `exec_sql` RPC を使用（存在しない）
   - **解決**: Supabase SQLエディタで手動適用（最も確実な方法）

2. **問題**: 初回テストで `knowledge_matches: 0` と表示
   - **解決**: APIレスポンスフィールド名が `sources` であることを確認、テストスクリプト修正

#### 変更ファイル
- `supabase/migrations/003_match_knowledge_by_category.sql` - 新規作成（カテゴリフィルタRPC関数）
- `src/app/api/chat/route.ts` - 新RPC関数に切り替え
- `src/lib/gemini.ts` - バッチ処理でのインデックス保持を修正
- `scripts/ingest-data.ts` - null embeddings をスキップ
- `scripts/ingest-btob-data.ts` - null embeddings をスキップ
- `scripts/test-category-filter.ts` - 新規作成（テストスクリプト）
- `scripts/test-chat-api.ts` - 新規作成（テストスクリプト）

#### Git コミット
- `c6ee76c` - Optimize category filtering with database-level search

---

## テンプレート（次回以降のセッション記録用）

### セッションX: [セッション名]

#### 実施日時
- YYYY-MM-DD HH:MM - HH:MM

#### 実施内容
1.
2.
3.

#### 動作確認
- [ ]
- [ ]

#### 次のステップ
-
-

#### 重要な決定事項
-

#### 問題と解決
1. **問題**:
   - **解決**:

#### 変更ファイル
- `path/to/file.ts` - 変更内容

---

## セッション記録のガイドライン

### 記録すべき内容
1. **実施内容**: 何を行ったか具体的に
2. **動作確認**: 何をテストして、結果はどうだったか
3. **次のステップ**: 次に何をするべきか
4. **重要な決定事項**: アーキテクチャや技術選定の決定
5. **問題と解決**: 遭遇した問題とその解決方法
6. **変更ファイル**: どのファイルを変更したか

### 記録のタイミング
- 作業開始時: 前回の記録を確認
- 重要な決定時: リアルタイムで記録
- 作業終了時: セッション全体をまとめて記録

### クラッシュからの復旧手順
1. このファイルを開く
2. 最後のセッションログを確認
3. 「次のステップ」から作業を再開
4. 「変更ファイル」を確認して、途中状態を把握
