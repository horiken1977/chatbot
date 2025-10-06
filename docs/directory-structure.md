# ディレクトリ構成案

## 推奨ディレクトリ構造

```
chatbot/
├── docs/                          # ドキュメント
│   ├── requirements.md            # 要件定義書
│   ├── architecture.md            # アーキテクチャ設計書
│   ├── development-plan.md        # 開発計画書
│   ├── api-spec.md               # API仕様書（今後追加）
│   └── deployment.md             # デプロイ手順（今後追加）
│
├── scripts/                       # ユーティリティスクリプト
│   ├── sync-data.ts              # スプレッドシート→DB同期
│   ├── setup-db.ts               # DB初期セットアップ
│   └── seed-data.ts              # テストデータ投入
│
├── src/                          # Next.jsアプリケーション本体
│   ├── app/                      # App Router
│   │   ├── page.tsx              # ポータルページ（トップ）
│   │   ├── layout.tsx            # ルートレイアウト
│   │   ├── globals.css           # グローバルスタイル
│   │   │
│   │   ├── chat/                 # チャット機能
│   │   │   └── [category]/      # 動的ルート（btob/btoc）
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                  # API Routes
│   │       ├── chat/
│   │       │   └── route.ts      # チャットAPI
│   │       ├── history/
│   │       │   └── [sessionId]/
│   │       │       └── route.ts  # 履歴取得API
│   │       └── sync/
│   │           └── route.ts      # データ同期API（管理用）
│   │
│   ├── components/               # Reactコンポーネント
│   │   ├── ui/                   # shadcn/ui コンポーネント
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   │
│   │   ├── chat/                 # チャット関連コンポーネント
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── RecommendationCard.tsx
│   │   │
│   │   └── portal/               # ポータル関連コンポーネント
│   │       ├── CategoryCard.tsx
│   │       └── Header.tsx
│   │
│   ├── lib/                      # ユーティリティ・ロジック
│   │   ├── supabase.ts           # Supabaseクライアント
│   │   ├── gemini.ts             # Gemini APIクライアント
│   │   ├── rag.ts                # RAGロジック
│   │   ├── sheets.ts             # Google Sheets API
│   │   ├── vector-search.ts      # ベクトル検索ロジック
│   │   └── utils.ts              # 汎用ユーティリティ
│   │
│   ├── types/                    # TypeScript型定義
│   │   ├── chat.ts               # チャット関連型
│   │   ├── knowledge.ts          # ナレッジデータ型
│   │   └── api.ts                # API型定義
│   │
│   └── config/                   # 設定ファイル
│       ├── prompts.ts            # プロンプトテンプレート
│       └── constants.ts          # 定数定義
│
├── public/                       # 静的ファイル
│   ├── images/
│   │   ├── logo.svg
│   │   └── icons/
│   └── fonts/
│
├── supabase/                     # Supabase関連
│   ├── migrations/               # DBマイグレーション
│   │   └── 001_initial_schema.sql
│   └── seed.sql                  # 初期データ
│
├── tests/                        # テストコード
│   ├── unit/                     # 単体テスト
│   │   ├── rag.test.ts
│   │   └── vector-search.test.ts
│   ├── integration/              # 結合テスト
│   │   └── api.test.ts
│   └── e2e/                      # E2Eテスト
│       └── chat-flow.spec.ts
│
├── .env.local                    # 環境変数（ローカル）
├── .env.example                  # 環境変数サンプル
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── README.md                     # プロジェクト概要
└── vercel.json                   # Vercelデプロイ設定
```

## ディレクトリ説明

### `/docs` - ドキュメント
プロジェクトの設計書・仕様書を集約。開発者やステークホルダーが参照。

### `/scripts` - スクリプト
データ同期、DB初期化などの運用スクリプト。開発時やメンテナンス時に実行。

### `/src` - アプリケーション本体
Next.jsアプリのソースコード。以下の構造：

#### `/src/app` - App Router
Next.js 14のApp Routerベース。ページとAPIを配置。

#### `/src/components` - コンポーネント
- `ui/`: shadcn/uiの再利用可能なUIコンポーネント
- `chat/`: チャット機能専用コンポーネント
- `portal/`: ポータル画面専用コンポーネント

#### `/src/lib` - ロジック層
ビジネスロジック、外部API連携、ユーティリティ関数。

#### `/src/types` - 型定義
TypeScriptの型定義を集約。型安全性を確保。

#### `/src/config` - 設定
プロンプトテンプレート、定数など設定値を管理。

### `/supabase` - Supabase関連
DBマイグレーションファイル、初期データ。バージョン管理。

### `/tests` - テスト
単体、結合、E2Eテストを分類。

---

## セットアップ後のイメージ

```
chatbot/
├── docs/                    # ✅ ドキュメント（既存を移動）
├── scripts/                 # 🆕 運用スクリプト
├── src/                     # 🆕 Next.jsアプリ
├── supabase/                # 🆕 DBマイグレーション
├── tests/                   # 🆕 テスト
├── public/                  # 🆕 静的ファイル
├── package.json             # 🆕 依存関係
├── .env.example             # 🆕 環境変数テンプレート
└── README.md                # 🆕 プロジェクト説明
```

---

## 次のアクション案

1. **既存ドキュメントを `docs/` に移動**
2. **Next.jsプロジェクト初期化**
3. **基本ディレクトリ作成**

実行しますか？
