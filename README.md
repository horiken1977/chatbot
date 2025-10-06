# マーケティングナレッジチャットボット

マーケティング教育コンテンツを対話型で検索できるAIチャットボットです。

## 概要

- **目的**: マーケティング学習者が、学習内容を自然言語で質問・検索できる
- **技術**: Next.js 15 + TypeScript + Tailwind CSS + Gemini API + Supabase
- **デプロイ**: Vercel

## 機能

- BtoB/BtoCマーケティングのカテゴリ別チャットボット
- RAG（検索拡張生成）によるハルシネーション抑制
- 関連トピックのレコメンド
- チャット履歴の保存

## ディレクトリ構成

```
chatbot/
├── docs/              # ドキュメント
├── scripts/           # データ同期スクリプト
├── src/               # Next.jsアプリケーション
│   ├── app/          # App Router
│   ├── components/   # Reactコンポーネント
│   ├── lib/          # ユーティリティ・ロジック
│   ├── types/        # TypeScript型定義
│   └── config/       # 設定ファイル
├── supabase/         # DBマイグレーション
├── tests/            # テストコード
└── public/           # 静的ファイル
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成し、以下を設定：

```bash
cp .env.example .env.local
```

必要なAPIキー：
- **Gemini API Key**: Google AI Studioで取得
- **Supabase URL & Keys**: Supabaseプロジェクトから取得
- **Google Sheets API Key**: Google Cloud Consoleで取得

### 3. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 にアクセス

## 開発フェーズ

### Phase 1: MVP（現在）
- [x] プロジェクトセットアップ
- [x] 基本UI実装
- [ ] データパイプライン構築
- [ ] RAG機能実装
- [ ] チャット機能実装

### Phase 2: 認証・管理
- [ ] ユーザー認証
- [ ] 管理画面

### Phase 3: 分析・改善
- [ ] 利用分析
- [ ] 検索精度向上

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm start` | 本番サーバー起動 |
| `npm run lint` | ESLint実行 |

## ドキュメント

### 必読ドキュメント
- [開発ガイドライン](docs/development-guidelines.md) - 開発ルール、禁止事項
- [環境変数管理](docs/environment-variables.md) - セキュリティ重要
- [MCP活用ガイド](docs/mcp-usage-guide.md) - Cipher/Serena使い方
- [自動復旧セットアップ](docs/auto-recovery-setup.md) - クラッシュ対策

### 設計ドキュメント
- [要件定義書](docs/requirements.md)
- [アーキテクチャ設計書](docs/architecture.md)
- [開発計画書](docs/development-plan.md)
- [ディレクトリ構成](docs/directory-structure.md)

### 運用ドキュメント
- [セッションログ](docs/session-log.md) - 作業履歴
- [影響範囲分析テンプレート](docs/impact-analysis/TEMPLATE.md)

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS
- **LLM**: Google Gemini API
- **ベクトルDB**: Supabase (PostgreSQL + pgvector)
- **デプロイ**: Vercel

## ライセンス

ISC
