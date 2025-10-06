# 環境変数管理ドキュメント

## 概要
このドキュメントは、プロジェクトで使用する環境変数の管理方法を定義します。

---

## 基本原則

### ❌ 絶対禁止
```typescript
// コード内に直接APIキーを書く
const apiKey = "AIzaSyC..."; // ❌ 絶対NG！

// 設定ファイルにAPIキーを書く
export const config = {
  geminiApiKey: "AIzaSyC...", // ❌ 絶対NG！
};
```

### ✅ 正しい方法
```typescript
// 環境変数から取得
const apiKey = process.env.GEMINI_API_KEY;

// 未設定時のエラー処理
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}
```

---

## 環境変数一覧

### 1. Gemini API

#### `GEMINI_API_KEY`
- **用途**: Google Gemini APIの認証
- **取得方法**: [Google AI Studio](https://aistudio.google.com/app/apikey)
- **必須**: Yes
- **環境**: Server Side
- **例**: `AIzaSyC...`

---

### 2. Supabase

#### `NEXT_PUBLIC_SUPABASE_URL`
- **用途**: Supabaseプロジェクトのエンドポイント
- **取得方法**: Supabase Dashboard > Settings > API
- **必須**: Yes
- **環境**: Client & Server
- **例**: `https://xxxxx.supabase.co`

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **用途**: Supabaseの匿名アクセスキー（公開可能）
- **取得方法**: Supabase Dashboard > Settings > API
- **必須**: Yes
- **環境**: Client & Server
- **例**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### `SUPABASE_SERVICE_ROLE_KEY`
- **用途**: Supabaseの管理者権限（サーバーサイドのみ）
- **取得方法**: Supabase Dashboard > Settings > API
- **必須**: Yes
- **環境**: Server Side
- **例**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **⚠️ 注意**: 絶対にクライアントサイドで使用しない

---

### 3. Google Sheets API

#### `GOOGLE_SHEETS_API_KEY`
- **用途**: Google Sheets APIへのアクセス
- **取得方法**: Google Cloud Console > APIs & Services > Credentials
- **必須**: Yes（データ同期スクリプトで使用）
- **環境**: Server Side
- **例**: `AIzaSyD...`

#### `GOOGLE_SHEETS_SPREADSHEET_ID`
- **用途**: 読み込むスプレッドシートのID
- **取得方法**: スプレッドシートのURLから抽出
- **必須**: Yes
- **環境**: Server Side
- **例**: `1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk`
- **現在の値**: `1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk`（BtoC）

---

## 環境別の設定方法

### ローカル開発環境

#### 1. `.env.local` ファイルを作成
```bash
cp .env.example .env.local
```

#### 2. 各環境変数を設定
```bash
# .env.local
GEMINI_API_KEY=your_actual_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_SHEETS_API_KEY=your_actual_sheets_api_key
GOOGLE_SHEETS_SPREADSHEET_ID=1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk
```

#### 3. `.env.local` は絶対にコミットしない
- `.gitignore` に既に含まれているので安全
- 誤ってコミットしないよう注意

---

### Vercel本番環境

#### 1. Vercelダッシュボードにアクセス
https://vercel.com/dashboard

#### 2. プロジェクト > Settings > Environment Variables

#### 3. 各環境変数を追加

| Key | Value | Environment |
|-----|-------|-------------|
| `GEMINI_API_KEY` | `AIzaSyC...` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Production, Preview, Development |
| `GOOGLE_SHEETS_API_KEY` | `AIzaSyD...` | Production, Preview, Development |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | `1fxu0TE...` | Production, Preview, Development |

#### 4. 設定後、再デプロイが必要
```bash
# または、Vercelダッシュボードから Redeploy
vercel --prod
```

---

## コード内での使用方法

### Server Component / API Route（サーバーサイド）
```typescript
// src/app/api/chat/route.ts
export async function POST(request: Request) {
  // すべての環境変数にアクセス可能
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!geminiApiKey || !serviceRoleKey) {
    return Response.json(
      { error: 'Required environment variables are not set' },
      { status: 500 }
    );
  }

  // 処理...
}
```

### Client Component（クライアントサイド）
```typescript
// src/components/Chat.tsx
'use client';

import { createClient } from '@supabase/supabase-js';

export default function Chat() {
  // NEXT_PUBLIC_ プレフィックスのみアクセス可能
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // ❌ 以下はクライアントサイドではundefinedになる
  // const apiKey = process.env.GEMINI_API_KEY; // undefined!
}
```

### 型安全な環境変数の使用（推奨）

#### `src/lib/env.ts` を作成
```typescript
// src/lib/env.ts
export const env = {
  // Server Side のみ
  geminiApiKey: process.env.GEMINI_API_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  googleSheetsApiKey: process.env.GOOGLE_SHEETS_API_KEY,
  googleSheetsSpreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,

  // Client & Server
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

// バリデーション関数
export function validateEnv() {
  const required = [
    'GEMINI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
```

#### 使用例
```typescript
// src/app/api/chat/route.ts
import { env, validateEnv } from '@/lib/env';

export async function POST(request: Request) {
  validateEnv();

  const apiKey = env.geminiApiKey!;
  // 処理...
}
```

---

## セキュリティベストプラクティス

### 1. クライアントサイドでの使用を避ける
- `NEXT_PUBLIC_` プレフィックスのない環境変数は、クライアントに露出しない
- APIキーは必ずサーバーサイドで使用

### 2. 環境変数のローテーション
- 定期的にAPIキーをローテーション（3-6ヶ月ごと）
- 漏洩の疑いがある場合は即座に再生成

### 3. 最小権限の原則
- 各環境変数は必要最小限の権限のみ付与
- 例: Google Sheets APIは読み取り専用

### 4. 開発環境と本番環境の分離
- 可能であれば、開発用と本番用で別のAPIキーを使用

---

## トラブルシューティング

### 環境変数が読み込まれない

#### チェック項目
1. `.env.local` ファイルが正しい場所にあるか（プロジェクトルート）
2. ファイル名が正確か（`.env.local`、`.env-local` ではない）
3. 開発サーバーを再起動したか（環境変数変更後は必須）
   ```bash
   # サーバーを停止してから再起動
   npm run dev
   ```
4. `NEXT_PUBLIC_` プレフィックスが必要か確認

### Vercelで環境変数が反映されない

#### チェック項目
1. Vercelダッシュボードで正しく設定されているか
2. 対象の環境（Production/Preview/Development）が選択されているか
3. 設定後に再デプロイしたか

---

## チェックリスト

### コード作成時
- [ ] 環境変数をハードコードしていない
- [ ] 未設定時のエラーハンドリングがある
- [ ] クライアント/サーバーサイドを正しく区別している

### デプロイ前
- [ ] `.env.local` がコミットされていない
- [ ] Vercelに環境変数を設定済み
- [ ] すべての必須環境変数が設定されている

### レビュー時
- [ ] APIキーがコードに含まれていない
- [ ] 環境変数の使用方法が適切

---

このドキュメントに従うことで、セキュアな環境変数管理が実現できます。
