# システムアーキテクチャ設計書

## 1. システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        ユーザー（スマホブラウザ）                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Next.js App)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ポータル画面  │  │ チャットUI    │  │  API Routes  │      │
│  │ (BtoB/BtoC)  │  │ (shadcn/ui)  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────┬───────┘      │
└───────────────────────────────────────────────┼──────────────┘
                                                │
                    ┌───────────────────────────┼───────────────┐
                    │                           │               │
                    ▼                           ▼               ▼
         ┌──────────────────┐      ┌──────────────────┐  ┌─────────────┐
         │  Google Gemini   │      │    Supabase      │  │   Google    │
         │   API (法人)      │      │  (Vector DB)     │  │  Sheets API │
         │                  │      │  - pgvector      │  │             │
         │ - Gemini Flash   │      │  - チャット履歴    │  │ データソース │
         │ - Embeddings     │      │  - ベクトル検索    │  │             │
         └──────────────────┘      └──────────────────┘  └─────────────┘
```

---

## 2. データフロー

### 2.1 初期データ投入（バッチ処理）

```
Google Sheets
    │
    ▼ (Google Sheets API)
データ取得スクリプト (Node.js)
    │
    ├─ テキスト抽出・構造化
    ├─ チャンク分割
    │
    ▼ (Gemini Embedding API)
ベクトル化
    │
    ▼ (Supabase REST API)
Vector DB 保存
```

### 2.2 ユーザー質問フロー（RAG）

```
1. ユーザー質問入力
    │
    ▼
2. Next.js API Route
    │
    ├─ 質問をベクトル化 (Gemini Embedding)
    │
    ▼
3. Supabase Vector Search
    │
    ├─ 類似度検索（コサイン類似度）
    ├─ Top-K件取得 (K=5-10)
    │
    ▼
4. コンテキスト構築
    │
    ├─ 検索結果を整形
    ├─ システムプロンプト組み立て
    │
    ▼
5. Gemini API 呼び出し
    │
    ├─ 回答生成
    ├─ 関連トピック抽出
    │
    ▼
6. レスポンス返却
    │
    ├─ チャット履歴保存 (Supabase)
    ├─ UI更新
```

---

## 3. データベース設計（Supabase）

### 3.1 ベクトルストアテーブル

```sql
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,  -- 'BtoB' or 'BtoC'
  sheet_name TEXT,
  row_number INTEGER,
  content TEXT NOT NULL,
  context TEXT,  -- 前後の文脈
  metadata JSONB,  -- 任意のメタデータ
  embedding vector(768),  -- text-embedding-004は768次元
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ベクトル検索用インデックス
CREATE INDEX ON knowledge_base
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- カテゴリフィルタ用インデックス
CREATE INDEX idx_category ON knowledge_base(category);
```

### 3.2 チャット履歴テーブル

```sql
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'BtoB' or 'BtoC'
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  sources JSONB,  -- 参照元データのID配列
  recommendations JSONB,  -- 関連トピック
  created_at TIMESTAMPTZ DEFAULT now()
);

-- セッションID検索用インデックス
CREATE INDEX idx_session ON chat_history(session_id, created_at DESC);
```

---

## 4. API設計

### 4.1 エンドポイント一覧

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/chat` | POST | 質問を送信、回答を取得 |
| `/api/history/:sessionId` | GET | チャット履歴取得 |
| `/api/sync-data` | POST | スプレッドシートからデータ同期（管理用） |

### 4.2 `/api/chat` 詳細

**リクエスト**
```json
{
  "message": "4Pとは何ですか？",
  "category": "BtoC",
  "sessionId": "uuid-v4",
  "conversationHistory": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

**レスポンス**
```json
{
  "response": "4Pとは、マーケティングミックスの4つの要素を指します...",
  "sources": [
    {
      "id": "uuid",
      "sheetName": "M6CH01001",
      "content": "4Pの説明..."
    }
  ],
  "recommendations": [
    {
      "topic": "マーケティングミックス",
      "preview": "4Pを活用した戦略立案..."
    }
  ]
}
```

---

## 5. RAG実装詳細

### 5.1 プロンプト設計

```typescript
const systemPrompt = `
あなたはマーケティング学習支援AIアシスタントです。

【重要な制約】
- 提供されたコンテキスト情報のみを使って回答してください
- コンテキストに情報がない場合は「その情報は学習コンテンツに含まれていません」と答えてください
- 推測や一般知識での回答は避けてください

【回答スタイル】
- 分かりやすく、簡潔に
- 必要に応じて例を含める
- 関連する学習トピックがあれば最後に提案

【コンテキスト】
${retrievedContext}

【ユーザーの質問】
${userQuestion}
`;
```

### 5.2 チャンク分割戦略

**方針**
- スプレッドシートの対話単位でチャンク化
- 前後の文脈も含める（オーバーラップ）
- 最大トークン数: 500トークン/チャンク

**例**
```
チャンク1:
  - 質問: "マーケティングとは？"
  - 回答: "顧客のニーズを満たす活動..."
  - 前後文脈: [前の対話, 次の対話]

チャンク2:
  - 質問: "4Pとは？"
  - 回答: "Product, Price, Place, Promotion..."
  - 前後文脈: [...]
```

### 5.3 検索パラメータ

```typescript
const searchConfig = {
  topK: 5,  // 上位5件取得
  threshold: 0.7,  // 類似度閾値（0.7以上）
  categoryFilter: 'BtoC',  // カテゴリフィルタ
};
```

---

## 6. フロントエンド設計

### 6.1 ページ構成

```
/
├── / (ポータル)
├── /chat/btob (BtoBチャット)
└── /chat/btoc (BtoCチャット)
```

### 6.2 コンポーネント構成

```
src/
├── app/
│   ├── page.tsx  (ポータル)
│   ├── chat/
│   │   ├── [category]/
│   │   │   └── page.tsx  (チャットページ)
│   └── api/
│       ├── chat/route.ts
│       └── history/[sessionId]/route.ts
├── components/
│   ├── ChatInterface.tsx
│   ├── MessageList.tsx
│   ├── MessageInput.tsx
│   ├── RecommendationCard.tsx
│   └── Portal.tsx
└── lib/
    ├── supabase.ts
    ├── gemini.ts
    └── rag.ts
```

### 6.3 状態管理

**MVP: React State + LocalStorage**
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [sessionId] = useState(() => uuidv4());

// ローカルストレージに保存
useEffect(() => {
  localStorage.setItem(`chat-${sessionId}`, JSON.stringify(messages));
}, [messages, sessionId]);
```

**将来: Zustand or Context API**（必要に応じて）

---

## 7. セキュリティ設計

### 7.1 API キー管理
```bash
# .env.local
GEMINI_API_KEY=xxx
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=xxx
GOOGLE_SHEETS_API_KEY=xxx
```

### 7.2 環境分離
- 開発環境: `.env.local`
- 本番環境: Vercel Environment Variables

### 7.3 レート制限
```typescript
// API Routeでレート制限
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

---

## 8. パフォーマンス最適化

### 8.1 キャッシュ戦略
- **よくある質問**: Redis/Upstashでキャッシュ（将来）
- **静的ページ**: Next.js Static Generation
- **API レスポンス**: `Cache-Control` ヘッダー

### 8.2 バンドル最適化
- **Code Splitting**: Dynamic Import
- **Tree Shaking**: 未使用コード削除
- **Image Optimization**: Next.js Image Component

---

## 9. モニタリング・ログ

### 9.1 Vercel Analytics
- ページビュー
- レスポンスタイム
- エラー率

### 9.2 ログ出力
```typescript
// 構造化ログ
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'Chat request processed',
  sessionId,
  category,
  responseTime: Date.now() - startTime,
}));
```

### 9.3 アラート設定（将来）
- Gemini APIエラー率 > 5%
- レスポンス時間 > 10秒
- Supabase接続エラー

---

## 10. スケーラビリティ

### 10.1 現状（同時接続10名）
- Vercel Hobby: 問題なし
- Supabase Free Tier: 十分

### 10.2 スケール時（100名+）
- Vercel Pro: $20/月
- Supabase Pro: $25/月
- Redis キャッシュ追加検討

---

## 11. デプロイメント

### 11.1 CI/CD（Vercel）
```yaml
# vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "GEMINI_API_KEY": "@gemini-api-key",
    "SUPABASE_URL": "@supabase-url"
  }
}
```

### 11.2 デプロイフロー
```
GitHub push
    │
    ▼
Vercel 自動ビルド
    │
    ├─ TypeScript型チェック
    ├─ ESLint
    ├─ ビルド
    │
    ▼
プレビューデプロイ（PR）
    │
    ▼ (mainブランチマージ)
本番デプロイ
```

---

## 12. バックアップ・災害復旧

### 12.1 データバックアップ
- **Supabase**: 自動日次バックアップ（Pro以上）
- **スプレッドシート**: Google Drive バージョン履歴

### 12.2 復旧手順
1. Supabaseバックアップからリストア
2. データ同期スクリプト再実行
3. Vercel再デプロイ

---

## 13. 将来拡張検討事項

### 13.1 認証機能追加時
```typescript
// Supabase Auth
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();
const { data: { session } } = await supabase.auth.getSession();
```

### 13.2 多言語対応
- i18n (next-intl)
- Geminiで翻訳

### 13.3 音声入力
- Web Speech API
- Whisper API連携

---

この設計書に基づき、次のステップとして実装を開始できます。
