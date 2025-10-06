# Supabase セットアップガイド

## 概要
このガイドでは、マーケティングナレッジチャットボット用のSupabaseプロジェクトをセットアップします。

---

## 前提条件

- Googleアカウント（Supabaseのサインアップに使用）
- ブラウザ

---

## ステップ1: Supabaseアカウント作成

### 1.1 Supabaseにアクセス
https://supabase.com/

### 1.2 サインアップ
1. **「Start your project」** をクリック
2. **「Continue with Google」** を選択
3. Googleアカウントでログイン

---

## ステップ2: プロジェクト作成

### 2.1 新規プロジェクト作成
1. **「New project」** をクリック
2. 以下を入力：

| 項目 | 値 |
|------|-----|
| **Name** | `marketing-chatbot` |
| **Database Password** | 強力なパスワード（必ず記録） |
| **Region** | `Northeast Asia (Tokyo)` または `Southeast Asia (Singapore)` |
| **Pricing Plan** | `Free` |

3. **「Create new project」** をクリック
4. プロジェクト作成完了まで **1-2分** 待機

### 2.2 プロジェクトURLとAPIキーの取得

プロジェクト作成後：

1. 左サイドバーの **「Settings」** → **「API」** をクリック
2. 以下の情報をコピーして保存：

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **重要**: `service_role key` は非常に強力な権限を持つため、**絶対にコードにコミットしない**

---

## ステップ3: pgvector拡張機能の有効化

### 3.1 SQL Editorを開く
1. 左サイドバーの **「SQL Editor」** をクリック
2. **「New query」** をクリック

### 3.2 pgvectorを有効化
以下のSQLを実行：

```sql
-- pgvector拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS vector;
```

3. **「Run」** をクリック
4. 成功メッセージ `Success. No rows returned` を確認

---

## ステップ4: ローカル環境の設定

### 4.1 環境変数ファイルの作成

プロジェクトルートで：

```bash
cd /path/to/chatbot
cp .env.example .env.local
```

### 4.2 環境変数を設定

`.env.local` を開いて、ステップ2.2で取得した値を設定：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **確認**: `.env.local` が `.gitignore` に含まれていることを確認（既に含まれています）

---

## ステップ5: データベーススキーマの作成

### 5.1 マイグレーションファイルの実行

1. 左サイドバーの **「SQL Editor」** をクリック
2. **「New query」** をクリック
3. `supabase/migrations/001_initial_schema.sql` の内容をコピー
4. SQL Editorに貼り付け
5. **「Run」** をクリック

### 5.2 テーブル作成の確認

1. 左サイドバーの **「Table Editor」** をクリック
2. 以下のテーブルが作成されていることを確認：
   - `knowledge_base`
   - `chat_history`

---

## ステップ6: 動作確認

### 6.1 Supabaseクライアントのインストール

```bash
npm install @supabase/supabase-js
```

### 6.2 接続テスト

ブラウザで以下のURLにアクセス：

```
http://localhost:3000/api/test-supabase
```

**期待される結果**:
```json
{
  "status": "All tests passed ✅",
  "results": {
    "clientTest": {
      "success": true,
      "message": "Client connection successful ✅"
    },
    "adminTest": {
      "success": true,
      "message": "Admin connection successful ✅"
    },
    "tableTest": {
      "success": true,
      "message": "Tables exist ✅ (knowledge_base, chat_history)"
    }
  }
}
```

**テスト内容**:
- ✅ クライアント接続テスト
- ✅ Admin接続テスト
- ✅ テーブル存在確認（knowledge_base, chat_history）

---

## トラブルシューティング

### エラー: "relation 'knowledge_base' does not exist"

**原因**: マイグレーションが実行されていない

**解決策**:
1. SQL Editorで `supabase/migrations/001_initial_schema.sql` を再実行
2. Table Editorでテーブルが作成されているか確認

### エラー: "Invalid API key"

**原因**: 環境変数が正しく設定されていない

**解決策**:
1. `.env.local` の内容を確認
2. SupabaseダッシュボードでAPIキーを再確認
3. 開発サーバーを再起動 `npm run dev`

### エラー: "extension 'vector' does not exist"

**原因**: pgvector拡張機能が有効化されていない

**解決策**:
1. ステップ3に戻る
2. `CREATE EXTENSION IF NOT EXISTS vector;` を実行

---

## セキュリティチェックリスト

- [ ] `.env.local` が `.gitignore` に含まれている
- [ ] `service_role key` をコードにハードコードしていない
- [ ] Database Passwordを安全に保管している
- [ ] Supabaseダッシュボードで2段階認証を有効化（推奨）

---

## 次のステップ

Supabaseセットアップが完了しました！

次は：
1. **Google Sheets API設定**
2. **データ取得スクリプト作成**
3. **RAG機能実装**

---

## 参考リンク

- Supabase公式ドキュメント: https://supabase.com/docs
- pgvectorドキュメント: https://github.com/pgvector/pgvector
- Supabase JavaScript Client: https://supabase.com/docs/reference/javascript/introduction

---

## 補足情報

### 無料枠の制限
- **データベース**: 500MB
- **転送量**: 2GB/月
- **API リクエスト**: 無制限

同時接続10名、月数千クエリ程度であれば無料枠内で運用可能です。

### リージョンの選択
- **推奨**: Northeast Asia (Tokyo) - 低レイテンシ
- **代替**: Southeast Asia (Singapore)

### バックアップ
- Free Tierでは自動バックアップなし
- データ投入後は、SQL Editorから定期的にエクスポート推奨
