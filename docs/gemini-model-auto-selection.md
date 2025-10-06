# Gemini モデル自動選択機能

## 概要

Geminiモデルは頻繁に更新・変更されるため、**自動でモデルを選択・フォールバック**する仕組みを実装しています。

## 仕組み

### 1. モデル選択の優先順位

最新・高性能なモデルを優先的に選択します:

```typescript
const MODEL_PRIORITY = [
  // Gemini 2.5シリーズ（最新）
  'gemini-2.5-flash',
  'gemini-2.5-pro',

  // Gemini 2.0シリーズ
  'gemini-2.0-flash',

  // Gemini 1.5シリーズ（フォールバック）
  'gemini-1.5-flash',
  'gemini-1.5-pro',

  // レガシー（最終フォールバック）
  'gemini-pro',
];
```

### 2. 自動検出プロセス

1. **利用可能なモデル一覧を取得**
   ```
   GET https://generativelanguage.googleapis.com/v1beta/models
   ```

2. **generateContentをサポートするモデルをフィルタ**

3. **優先順位に従って最適なモデルを選択**

4. **24時間キャッシュ**（API呼び出しを削減）

### 3. フォールバック

- API呼び出しに失敗した場合: デフォルトで`gemini-2.0-flash`を使用
- 優先順位に一致するモデルがない場合: 利用可能な最初のモデルを使用

## 使用方法

### チャットAPIでの自動選択

```typescript
import { getGenerationModel } from '@/lib/gemini-models';

const model = await getGenerationModel();
// => "gemini-2.5-flash-preview-05-20" など最新モデルが返される
```

### 現在のモデルを確認

```bash
# API経由で確認
curl http://localhost:3001/api/model-info
```

レスポンス:
```json
{
  "success": true,
  "currentModel": "gemini-2.5-flash-preview-05-20",
  "isCached": true,
  "message": "Using cached model (refreshes every 24 hours)"
}
```

### モデルキャッシュを手動更新

```bash
# POSTでキャッシュクリア＆再選択
curl -X POST http://localhost:3001/api/model-info
```

レスポンス:
```json
{
  "success": true,
  "message": "Model cache cleared and refreshed",
  "newModel": "gemini-2.5-flash-preview-05-20"
}
```

## ファイル構成

- **[src/lib/gemini-models.ts](../src/lib/gemini-models.ts)** - モデル選択ロジック
- **[src/app/api/model-info/route.ts](../src/app/api/model-info/route.ts)** - モデル情報API
- **[src/app/api/chat/route.ts](../src/app/api/chat/route.ts)** - チャットAPI（自動選択を使用）

## メリット

✅ **新しいモデルに自動対応**
- Geminiが新モデルをリリースしても、コード変更不要
- 常に最新・最適なモデルを使用

✅ **フォールバック機能**
- モデルが廃止されても、自動で代替モデルを選択
- サービス継続性が向上

✅ **パフォーマンス最適化**
- 24時間キャッシュでAPI呼び出しを削減
- 高速なレスポンス

✅ **透明性**
- `/api/model-info`で現在のモデルを確認可能
- デバッグが容易

## 将来の拡張

必要に応じて以下の機能を追加可能:

- **カスタム優先順位**: 環境変数で優先モデルを指定
- **A/Bテスト**: 複数モデルを並行使用
- **コスト最適化**: 使用量に応じてモデルを切り替え
- **パフォーマンス監視**: モデルごとの応答速度を記録

## トラブルシューティング

### モデルが見つからない場合

1. API keyが正しいか確認
2. `/api/model-info`で現在のモデルを確認
3. `POST /api/model-info`でキャッシュを更新

### 特定のモデルを強制使用したい場合

`src/lib/gemini-models.ts`の`MODEL_PRIORITY`配列を編集:

```typescript
const MODEL_PRIORITY = [
  'your-preferred-model',  // 最優先
  // ... その他
];
```
