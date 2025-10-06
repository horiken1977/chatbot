# Vercel デプロイ手順

このドキュメントでは、マーケティング知識チャットボットをVercelにデプロイする手順を説明します。

## 前提条件

- GitHubアカウント
- Vercelアカウント（https://vercel.com）
- 環境変数の値（.env.localから取得）

## 手順

### 1. Vercelプロジェクトの作成

1. **Vercel にログイン**: https://vercel.com/login
2. **New Project をクリック**
3. **GitHubリポジトリをインポート**:
   - `horiken1977/chatbot` を選択
   - **Import** をクリック

### 2. プロジェクト設定

#### Framework Preset
- **Next.js** が自動検出されることを確認

#### Root Directory
- デフォルト（`.`）のままでOK

#### Build and Output Settings
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. 環境変数の設定

**Environment Variables** セクションで以下を設定:

```
NEXT_PUBLIC_SUPABASE_URL=https://zzihlhqenamdjdwgscqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSyCKthzCsOa5viWt_bwI8bN0tcKiIlU5xYo
GOOGLE_SHEETS_API_KEY=AIzaSyBCKLMQJVqZHCORpRniGVLthmdwUf2bDXk
GOOGLE_SHEETS_SPREADSHEET_ID=1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk
```

⚠️ **重要**: 各環境変数を **Production**, **Preview**, **Development** すべてにチェック

### 4. デプロイ

1. **Deploy** ボタンをクリック
2. ビルドログを確認
3. デプロイ完了後、URLが表示される（例: `https://chatbot-xxx.vercel.app`）

## GitHub Actions による自動デプロイ

### 1. Vercel Token の取得

1. Vercel Settings: https://vercel.com/account/tokens
2. **Create Token** をクリック
3. トークン名: `GitHub Actions`
4. 生成されたトークンをコピー

### 2. Vercel Project ID の取得

1. プロジェクト Settings → General
2. **Project ID** をコピー

### 3. Vercel Org ID の取得

1. Settings → General
2. **Team ID** または **User ID** をコピー

### 4. GitHub Secrets の設定

GitHubリポジトリで:

1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** で以下を追加:

```
VERCEL_TOKEN=<生成したトークン>
VERCEL_ORG_ID=<Org ID>
VERCEL_PROJECT_ID=<Project ID>

# 環境変数
NEXT_PUBLIC_SUPABASE_URL=https://zzihlhqenamdjdwgscqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSyCKthzCsOa5viWt_bwI8bN0tcKiIlU5xYo
GOOGLE_SHEETS_API_KEY=AIzaSyBCKLMQJVqZHCORpRniGVLthmdwUf2bDXk
GOOGLE_SHEETS_SPREADSHEET_ID=1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk
```

### 5. 自動デプロイのテスト

1. `main` ブランチにプッシュ
2. **Actions** タブで進行状況を確認
3. デプロイ完了後、Vercel URLで確認

## トラブルシューティング

### ビルドエラー

**症状**: `Type error: ...`

**解決策**:
```bash
# ローカルで型チェック
npm run build

# エラーを修正してコミット
git add .
git commit -m "Fix type errors"
git push
```

### 環境変数エラー

**症状**: `Environment variable not set`

**解決策**:
1. Vercel Dashboard → Settings → Environment Variables
2. 不足している変数を追加
3. **Redeploy** をクリック

### API エラー

**症状**: `Knowledge search failed`

**解決策**:
1. Supabase Dashboard で `match_knowledge` 関数が存在するか確認
2. 存在しない場合、SQLエディタで以下を実行:

```sql
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  sheet_name TEXT,
  row_number INTEGER,
  content TEXT,
  context TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_base.id,
    knowledge_base.category,
    knowledge_base.sheet_name,
    knowledge_base.row_number,
    knowledge_base.content,
    knowledge_base.context,
    knowledge_base.metadata,
    1 - (knowledge_base.embedding <=> query_embedding) AS similarity
  FROM knowledge_base
  WHERE 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## デプロイ後の確認

### 1. 基本動作確認

- [ ] トップページが表示される
- [ ] 質問を入力できる
- [ ] 回答が返ってくる
- [ ] 参考ソースが表示される

### 2. API確認

```bash
# データ検証
curl https://your-app.vercel.app/api/verify-data

# モデル情報
curl https://your-app.vercel.app/api/model-info

# チャットテスト
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"マーケティングとは何ですか？"}'
```

### 3. パフォーマンス確認

- [ ] 初回レスポンス時間（目安: 3-5秒）
- [ ] 2回目以降のレスポンス時間（目安: 2-3秒）
- [ ] エラーハンドリングが適切に動作

## カスタムドメイン設定（オプション）

1. Vercel Dashboard → Settings → Domains
2. ドメインを追加
3. DNSレコードを設定
4. SSL証明書が自動で発行される

## 本番環境の管理

### ログ確認

Vercel Dashboard → Deployments → ログを確認

### モニタリング

- **Analytics**: Vercel Analytics で使用状況を確認
- **Logs**: リアルタイムログで API エラーを監視

### ロールバック

問題が発生した場合:
1. Vercel Dashboard → Deployments
2. 以前の正常なデプロイを選択
3. **Promote to Production** をクリック
