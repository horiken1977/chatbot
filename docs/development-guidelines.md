# 開発ガイドライン

## 目的
このドキュメントは、開発中のクラッシュ対策、品質保証、デグレ防止のためのガイドラインです。

---

## 1. MCP サーバー活用

### 1.1 Cipher（対話記録）
**目的**: VSCode/Claude Codeのクラッシュ時に作業を復元可能にする

**設定状況**: ✅ 有効（`~/.claude/config.json`に設定済み）

**運用ルール**:
- 重要な意思決定、要件変更は必ずCipherに記録
- 各開発セッション開始時に前回の記録を確認
- コード変更前後で記録を残す

**記録すべき内容**:
```
- 日時
- 実装内容・変更内容
- 変更理由
- 影響範囲
- テスト結果
```

**詳細**: [MCP活用ガイド](mcp-usage-guide.md#cipher-の活用方法)を参照

### 1.2 Serena（インテリジェントコーディング）
**目的**: コード品質向上、ベストプラクティス適用

**設定状況**: ✅ 有効（`serena-chatbot`として設定済み）

**活用場面**:
- 新規機能実装前の設計レビュー
- コードリファクタリング
- パフォーマンス最適化
- セキュリティチェック

**詳細**: [MCP活用ガイド](mcp-usage-guide.md#serena-の活用方法)を参照

---

## 2. コード改変時の必須プロセス

### 2.1 影響範囲分析（Impact Analysis）

**すべてのコード変更前に実施**:

#### ステップ1: 変更対象の特定
```
- ファイル名
- 関数/コンポーネント名
- 変更内容の概要
```

#### ステップ2: 依存関係の調査
```bash
# ファイルの参照元を検索
grep -r "import.*ファイル名" src/

# 関数の使用箇所を検索
grep -r "関数名" src/
```

#### ステップ3: 影響範囲の文書化
以下のテンプレートを使用（`docs/impact-analysis/`に保存）

#### ステップ4: ユーザー確認
- 影響範囲をユーザーに提示
- 承認を得てから実装開始

### 2.2 変更前チェックリスト

- [ ] 影響範囲分析を実施
- [ ] ユーザーに影響範囲を確認
- [ ] 既存のテストが壊れないか確認
- [ ] 環境変数をハードコードしていないか確認
- [ ] 型安全性を保っているか確認

### 2.3 変更後チェックリスト

- [ ] ローカルで動作確認
- [ ] 影響範囲のすべての機能をテスト
- [ ] ESLintエラーなし
- [ ] TypeScriptエラーなし
- [ ] ビルド成功
- [ ] 変更内容をCipherに記録

---

## 3. 絶対禁止事項

### 3.1 要件理解関連

#### ❌ ユーザーの明示的な指示の独自解釈・変更
**NG例**:
```typescript
// ユーザー: "BtoB/BtoCを選択できるようにして"
// ダメな実装: 勝手にBtoEも追加
const categories = ['btob', 'btoc', 'btoe']; // ❌
```

**OK例**:
```typescript
// ユーザーの指示通り
const categories = ['btob', 'btoc']; // ✅
```

#### ❌ 曖昧な要件での実装開始
**必須**: 不明点は必ず事前確認

**確認すべきポイント**:
- 機能の目的・ゴール
- UI/UX の詳細
- データ構造
- エラーハンドリング方針

#### ❌ 形式的なTodo完了
**NG例**:
```
✅ チャット機能実装 → 実際は空の関数のみ
```

**OK例**:
```
✅ チャット機能実装
  - メッセージ送信: テスト済み
  - メッセージ受信: テスト済み
  - エラーハンドリング: テスト済み
```

#### ❌ 実装後の要件適合性チェック省略
**必須**: 実装後に要件定義書と照合

#### ❌ コード内の環境変数ベタ書き
**NG例**:
```typescript
const apiKey = "AIzaSyC..."; // ❌ 絶対NG
```

**OK例**:
```typescript
const apiKey = process.env.GEMINI_API_KEY; // ✅
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set');
}
```

**環境変数の管理場所**:
- ローカル: `.env.local`
- Vercel: Environment Variables（ダッシュボード）

---

## 4. 追加の推奨事項

### 4.1 Git運用ルール

#### ブランチ戦略
```
main          : 本番環境
develop       : 開発環境
feature/*     : 機能開発
fix/*         : バグ修正
```

#### コミットメッセージ規約
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント変更
refactor: リファクタリング
test: テスト追加
chore: ビルド・設定変更
```

**例**:
```bash
git commit -m "feat: チャットメッセージ送信機能を実装"
git commit -m "fix: ベクトル検索時のエラーハンドリングを修正"
```

### 4.2 コードレビュー観点

#### セキュリティ
- [ ] APIキーがコードに含まれていない
- [ ] ユーザー入力のバリデーション実施
- [ ] SQLインジェクション対策（Supabase使用で基本的にOK）
- [ ] XSS対策（Reactのエスケープで基本的にOK）

#### パフォーマンス
- [ ] 不要な再レンダリングがない
- [ ] 大量データ処理時のメモリリーク防止
- [ ] APIコールの最適化（キャッシュ等）

#### メンテナンス性
- [ ] 関数は単一責任の原則に従っている
- [ ] 適切なコメントがある（複雑なロジックのみ）
- [ ] マジックナンバーを避ける（定数化）

### 4.3 テスト戦略

#### ユニットテスト
```typescript
// src/lib/vector-search.test.ts
describe('vectorSearch', () => {
  it('should return top K results', async () => {
    const results = await vectorSearch('test query', 5);
    expect(results).toHaveLength(5);
  });
});
```

#### 統合テスト
```typescript
// tests/integration/api.test.ts
describe('POST /api/chat', () => {
  it('should return chat response', async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'test' }),
    });
    expect(response.ok).toBe(true);
  });
});
```

### 4.4 エラーハンドリング標準

#### API Route
```typescript
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

#### フロントエンド
```typescript
const handleSubmit = async (message: string) => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    // 処理
  } catch (error) {
    setError('メッセージの送信に失敗しました');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

### 4.5 ドキュメント更新ルール

**コード変更時は必ず関連ドキュメントも更新**:

- API変更 → `docs/api-spec.md` 更新
- アーキテクチャ変更 → `docs/architecture.md` 更新
- 新機能追加 → `README.md` 更新

### 4.6 定期的なレビュー項目

#### 週次
- [ ] Vercel Analyticsでエラー率確認
- [ ] Supabase使用量確認
- [ ] Gemini API使用量確認

#### 月次
- [ ] 依存パッケージの更新確認
- [ ] セキュリティアラート確認
- [ ] パフォーマンス指標レビュー

---

## 5. 緊急時の対応手順

### 5.1 本番環境でエラー発生時

1. **即座にロールバック**
   ```bash
   # Vercelダッシュボードで前のデプロイに戻す
   ```

2. **エラーログ確認**
   - Vercel Logs
   - Supabase Logs
   - ブラウザコンソール

3. **影響範囲の特定**
   - どの機能が影響を受けているか
   - ユーザー数は？

4. **修正と再デプロイ**
   - ローカルで修正
   - テスト
   - ステージング確認
   - 本番デプロイ

### 5.2 データ損失時

1. **Supabaseバックアップから復元**
2. **データ同期スクリプト再実行**
3. **整合性確認**

---

## 6. チェックリストサマリー

### 実装開始前
- [ ] 要件が明確か確認
- [ ] 影響範囲分析を実施
- [ ] ユーザーに確認
- [ ] Cipherに記録

### 実装中
- [ ] 環境変数をハードコードしない
- [ ] 型安全性を保つ
- [ ] エラーハンドリング実装
- [ ] コメント（必要に応じて）

### 実装後
- [ ] ローカルテスト
- [ ] ESLint/TypeScriptエラーなし
- [ ] ビルド成功
- [ ] 影響範囲すべてテスト
- [ ] ドキュメント更新
- [ ] Cipherに結果記録

---

このガイドラインに従うことで、デグレ防止、品質向上、クラッシュ時の復旧が容易になります。
