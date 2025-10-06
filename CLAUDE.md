# Claude AI アシスタント用プロジェクトガイド

> このファイルは Claude Code が優先的に読み込む、人間が読みやすい形式のプロジェクトガイドです。
> 技術的な設定は `.clauderc` と `.clinerules` に記載されています。

---

## 🎯 プロジェクトミッション

**マーケティングナレッジチャットボット**を開発し、マーケティング学習者が自然言語で教育コンテンツを検索できるようにする。

### 重要な背景
- 現在、スマホアプリでマーケティング教育を提供中
- Google Sheets にすべての対話型教育コンテンツが格納されている
- BtoB と BtoC で**完全に分離**したチャットボットが必要
- ハルシネーションを極力抑えた回答が必須（RAG方式採用）

---

## ⚠️ 最重要：絶対に守るべきルール

### 1. コード変更前の必須プロセス
```
❌ いきなりコード変更
✅ 影響範囲分析 → ユーザー確認 → 実装 → テスト → 記録
```

**具体的な手順**:
1. `docs/impact-analysis/TEMPLATE.md` をコピーして影響範囲分析を作成
2. 依存関係を調査（`grep -r` で検索）
3. 分析結果をユーザーに提示して承認を得る
4. 承認後に実装開始

### 2. 環境変数の扱い
```typescript
// ❌ 絶対NG
const apiKey = "AIzaSyC...";

// ✅ 必ずこうする
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set');
}
```

### 3. ユーザー指示の解釈
```
❌ 「BtoB/BtoC選択」→ 勝手にBtoEも追加
✅ 「BtoB/BtoC選択」→ 指示通りBtoBとBtoCのみ
```

**不明点があれば必ず質問する**

### 4. Todo の完了基準
```
❌ 形式的な完了
   ✅ チャット機能実装 → 実際は空の関数のみ

✅ 実質的な完了
   ✅ チャット機能実装
      - メッセージ送信: テスト済み ✅
      - メッセージ受信: テスト済み ✅
      - エラーハンドリング: テスト済み ✅
```

---

## 📚 必ず参照すべきドキュメント

### コード変更時
1. **開発ガイドライン** (`docs/development-guidelines.md`)
   - コード変更プロセス
   - エラーハンドリング標準
   - テスト戦略

2. **環境変数管理** (`docs/environment-variables.md`)
   - 環境変数の使い方
   - セキュリティベストプラクティス

3. **影響範囲分析テンプレート** (`docs/impact-analysis/TEMPLATE.md`)
   - すべてのコード変更前に使用

### 機能実装時
1. **要件定義書** (`docs/requirements.md`)
   - 機能要件
   - 非機能要件
   - データ構造

2. **アーキテクチャ設計書** (`docs/architecture.md`)
   - システム構成
   - データフロー
   - API設計

3. **開発計画書** (`docs/development-plan.md`)
   - 開発フェーズ
   - マイルストーン

### セッション開始/終了時
1. **セッションログ** (`docs/session-log.md`)
   - 前回の作業内容
   - 次のステップ
   - 決定事項

---

## 🛠️ 開発の進め方

### セッション開始時のルーティン
```bash
# 1. 前回のセッションログを確認
tail -n 50 docs/session-log.md

# 2. Git の状態確認
git status

# 3. 最近変更されたファイル確認
find src -type f -mtime -1
```

### 新機能実装のフロー
```
1. 要件定義書で要件を確認
2. アーキテクチャ設計書で設計方針を確認
3. Serena に「この機能の最適な実装方法は？」と質問
4. 影響範囲分析を作成
5. ユーザーに確認
6. 実装
7. テスト
8. Cipher に記録
9. session-log.md を更新
```

### バグ修正のフロー
```
1. 問題を Cipher に記録
2. 影響範囲を調査
3. Serena に「類似の実装はどうなっている？」と質問
4. 修正
5. テスト（影響範囲すべて）
6. Cipher に解決策を記録
```

---

## 🔧 技術スタック詳細

### フロントエンド
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript** (厳格モード)
- **Tailwind CSS v4** (`@tailwindcss/postcss`)

### バックエンド
- **Next.js API Routes**
- **Supabase** (PostgreSQL + pgvector)
- **Google Gemini API** (既存法人契約)

### データソース
- **Google Sheets API**
- BtoC: `1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk`
- BtoB: 別途追加予定

### デプロイ
- **Vercel Hobby** (無料枠で運用)

---

## 🎨 コーディング規約

### ファイル命名
```
✅ コンポーネント: ChatInterface.tsx (PascalCase)
✅ ユーティリティ: vector-search.ts (kebab-case)
✅ API Route: route.ts (kebab-case)
```

### インポート順序
```typescript
// 1. React/Next.js
import { useState } from 'react';
import { NextRequest } from 'next/server';

// 2. サードパーティ
import { createClient } from '@supabase/supabase-js';

// 3. 内部モジュール
import { vectorSearch } from '@/lib/vector-search';

// 4. 型定義
import type { ChatMessage } from '@/types/chat';

// 5. スタイル
import './styles.css';
```

### エラーハンドリング標準
```typescript
// API Route
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.message) {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 処理
    const result = await processChat(body.message);

    return Response.json(result);
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🚀 現在の開発状況

### ✅ 完了済み
- プロジェクトセットアップ（Next.js, TypeScript, Tailwind CSS）
- 基本UI（ポータルページ、チャット骨組み）
- 開発ガイドライン整備
- MCP設定（Cipher, Serena）
- 自動復旧の仕組み

### 🔄 次のステップ
1. **Supabase セットアップ**
   - プロジェクト作成
   - ベクトルDB構築
   - マイグレーション作成

2. **データパイプライン**
   - Google Sheets API設定
   - データ取得スクリプト
   - ベクトル化・DB投入

3. **RAG機能実装**
   - Gemini API統合
   - ベクトル検索
   - チャットAPI

4. **チャットUI完成**
   - メッセージ表示
   - 入力フォーム
   - 履歴機能
   - 関連トピック表示

---

## 💬 MCP サーバー活用

### Cipher（対話記録）
**いつ使う**: 常時自動記録

**明示的に記録すべきタイミング**:
- 重要な意思決定時
- 問題が発生したとき
- 解決策を見つけたとき
- セッション終了時

### Serena（インテリジェントコーディング）
**いつ使う**: 設計・実装の前

**質問例**:
```
「チャットAPIを実装したいです。このプロジェクトの
APIルートの標準的な構造を教えてください」

「ベクトル検索を実装する際の、このプロジェクトでの
ベストプラクティスは？」

「このコードはプロジェクトのアーキテクチャと
整合性が取れていますか？」
```

詳細: `docs/mcp-usage-guide.md`

---

## 🔍 よくある質問への回答

### Q: 新しい機能を追加したい
A: 以下の順序で進めてください
1. `docs/requirements.md` で要件を確認
2. `docs/architecture.md` で設計方針を確認
3. 影響範囲分析を作成
4. ユーザーに確認
5. 実装

### Q: エラーが発生した
A: 以下を実施してください
1. エラー内容を Cipher に記録
2. 影響範囲を調査
3. Serena に類似実装を質問
4. 修正後、解決策を Cipher に記録

### Q: 環境変数の追加が必要
A: 以下を実施してください
1. `.env.example` に追加
2. `docs/environment-variables.md` に説明追加
3. ユーザーに `.env.local` への追加を依頼
4. Vercel環境変数への追加を確認

### Q: データ構造を変更したい
A: 必ず以下を実施してください
1. 影響範囲分析（データフロー全体）
2. マイグレーション計画
3. ユーザーに確認（破壊的変更の可能性）
4. バックアップ計画

---

## 📝 チェックリスト

### コード変更前
- [ ] 影響範囲分析を作成
- [ ] 依存関係を調査（grep検索）
- [ ] ユーザーに確認
- [ ] テスト計画を立てる

### 実装中
- [ ] 環境変数をハードコードしない
- [ ] TypeScript型エラーなし
- [ ] ESLintエラーなし
- [ ] エラーハンドリング実装

### 実装後
- [ ] ローカルでテスト
- [ ] 影響範囲すべてテスト
- [ ] Cipherに記録
- [ ] session-log.md更新

### デプロイ前
- [ ] `npm run build` 成功
- [ ] すべてのテスト通過
- [ ] 環境変数をVercelに設定
- [ ] ステージング環境で確認

---

## 🆘 トラブルシューティング

### Tailwind CSS が動作しない
```bash
# Tailwind v4 の設定確認
cat postcss.config.mjs
# → @tailwindcss/postcss が設定されているか

# グローバルCSSの確認
cat src/app/globals.css
# → @import "tailwindcss"; があるか
```

### 環境変数が読み込まれない
```bash
# ファイル名確認
ls -la .env.local
# → 正しいファイル名か

# 開発サーバー再起動
npm run dev
```

### MCP が動作しない
```bash
# Cipher確認
which cipher

# Serena確認
cat ~/.claude/config.json | grep serena-chatbot

# Claude Code 完全再起動
```

---

## 🎓 学習リソース

### プロジェクト内ドキュメント
1. `docs/development-guidelines.md` - 開発の進め方
2. `docs/mcp-usage-guide.md` - Cipher/Serenaの使い方
3. `docs/auto-recovery-setup.md` - クラッシュ復旧

### 外部リソース
- Next.js 15: https://nextjs.org/docs
- Supabase pgvector: https://supabase.com/docs/guides/ai
- Gemini API: https://ai.google.dev/docs

---

## 📌 重要な決定事項（履歴）

### 2025-10-05
- Tailwind CSS v4 を採用（`@tailwindcss/postcss`使用）
- Vercel Hobby環境で無料運用を目指す
- Supabase無料枠で開始
- MCP: Cipher + Serena（serena-chatbot）を活用

---

## 🤝 コミュニケーションガイドライン

### 不明点がある場合
```
❌ 「おそらく〜だと思います」で進める
✅ 「〜は〜という理解で合っていますか？」と確認
```

### 提案をする場合
```
❌ 「〜を実装しました」（事後報告）
✅ 「〜を実装したいと思いますが、影響範囲は以下です。よろしいですか？」
```

### エラーが発生した場合
```
❌ 「エラーが出ました」（曖昧）
✅ 「〜のファイルで〜というエラーが発生しました。〜が原因と考えられます。〜で修正しますがよろしいですか？」
```

---

このガイドに従うことで、品質の高い開発とスムーズなコミュニケーションが実現できます。

不明点があれば、いつでも質問してください。
