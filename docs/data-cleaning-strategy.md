# データクリーニング戦略

## データ構造の分析結果

### スプレッドシート構造
```
M6CH01001〜M6CH01182 (182シート)
各シート:
- A列: message_id
- B列: section (Intro, Lecture, etc.)
- C列: type (article, description, text, survey, etc.)
- D列: subtype
- E列: contents ⭐ (メインコンテンツ - ここをクリーニング)
- F列: choices
- G列: correct_answer
- H〜L列: その他のメタデータ
```

### 確認された問題点

#### 1. カスタムタグ（独自記法）
```
[びpho] - 不明な独自タグ
[dwflw] - 画像参照？
[zmH08] - 画像参照？
[1vTmt4d] - 画像参照？
[center] - センタリング
[img] - 画像
[/style] - スタイル終了
```

#### 2. HTMLタグ
```
<div style="...">
<center>
<style>...</style>
<p>
```

#### 3. 画像URL
```
https://firebasestorage.googleapis.com/v0/b/elearning-production.appspot.com/...
```

#### 4. メタ情報
```
--- img (画像のプレースホルダー)
```

---

## クリーニング戦略

### Phase 1: タグ除去

#### 1.1 カスタムタグの除去
```typescript
// [xxx] 形式のタグをすべて除去
text = text.replace(/\[[\w\u3040-\u309F\u30A0-\u30FF]+\]/g, '');

// {xxx} 形式のタグを除去
text = text.replace(/\{[\w\u3040-\u309F\u30A0-\u30FF]+\}/g, '');
```

#### 1.2 HTMLタグの除去
```typescript
// <style>...</style> ブロック全体を除去
text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

// その他のHTMLタグを除去
text = text.replace(/<[^>]+>/g, '');
```

#### 1.3 画像URL・メタ情報の除去
```typescript
// Firebase Storage URLを除去
text = text.replace(/https:\/\/firebasestorage\.googleapis\.com\/[^\s]+/g, '[画像]');

// --- img などのプレースホルダーを除去
text = text.replace(/---\s*img/gi, '');
```

### Phase 2: テキスト正規化

#### 2.1 連続する空白・改行の正規化
```typescript
// 連続する空白を1つに
text = text.replace(/\s+/g, ' ');

// 連続する改行を2つまでに
text = text.replace(/\n{3,}/g, '\n\n');

// 前後の空白をトリム
text = text.trim();
```

#### 2.2 特殊文字の正規化
```typescript
// 全角スペースを半角に
text = text.replace(/　/g, ' ');

// ゼロ幅文字を除去
text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
```

### Phase 3: 意味のあるコンテンツの抽出

#### 3.1 対話タイプ別の処理
```typescript
switch (type) {
  case 'Lecture':
  case 'description':
  case 'text':
    // 説明文として扱う
    content = cleanedText;
    break;

  case 'survey':
  case 'multiple_choice':
    // 質問として扱う（choicesも含める）
    content = cleanedText;
    if (choices) {
      content += '\n選択肢: ' + choices;
    }
    break;

  case 'article':
    // 記事として扱う
    content = cleanedText;
    break;

  default:
    // その他
    content = cleanedText;
}
```

---

## チャンク分割戦略

### 方針
1. **基本単位**: 1行 = 1チャンク（message単位）
2. **長い場合**: 500トークン超える場合は分割
3. **文脈付加**: section情報を各チャンクに付加

### 実装
```typescript
interface Chunk {
  sheetName: string;
  section: string; // Intro, Lecture, etc.
  type: string; // article, description, etc.
  messageId: string;
  content: string;
  context: string; // 前後のメッセージ
  metadata: {
    hasChoices: boolean;
    correctAnswer?: string;
  };
}
```

### チャンク生成ロジック
```typescript
1. 各行を読み込み
2. E列（contents）をクリーニング
3. トークン数をカウント
4. 500トークン以下なら1チャンク
5. 500トークン超える場合:
   - 文章を意味のある単位で分割
   - 各分割に section/type 情報を付加
6. 前後1-2メッセージを context として付加
```

---

## 実装の優先順位

### 高優先度
1. ✅ カスタムタグ除去 `[xxx]`, `{xxx}`
2. ✅ HTMLタグ除去 `<xxx>`
3. ✅ 画像URL除去
4. ✅ 空白・改行の正規化

### 中優先度
5. ✅ type別の処理
6. ✅ choices の統合
7. ✅ section情報の付加

### 低優先度
8. メタデータの活用（skill, exp など）
9. incorrect_message の活用

---

## テスト戦略

### Phase 1: 1シートテスト（M6CH01001）
```bash
node scripts/test-single-sheet.ts M6CH01001
```
期待結果:
- クリーニング前後の比較表示
- チャンク数の確認
- サンプルチャンクの内容確認

### Phase 2: クリーニング精度の検証
```
手動で以下を確認:
1. タグが除去されているか
2. 意味のあるテキストが残っているか
3. 文脈が適切に保持されているか
```

### Phase 3: 10シートテスト
```bash
node scripts/test-multiple-sheets.ts --limit 10
```
期待結果:
- 各シートの処理成功
- エラーハンドリングの確認
- 処理時間の測定

---

## 除外するデータ

### 完全に除外
- `<style>` ブロック全体
- 画像URL（`[画像]` に置換）
- `--- img` などのプレースホルダー

### 保持するデータ
- 説明文・講義内容（E列のテキスト部分）
- 質問文
- 選択肢（F列）
- section/type 情報（メタデータとして）

---

## クリーニング後の例

### Before (E列の生データ):
```
[びpho]<div style="font-family: 'Arial'; font-size: 100%;">
<center>{
text-align: center;
[img]{
--- img
background-color: #FFFFFF;
</style>
<p>マーケティングとは何でしょうか。</p>
[dwflw]--- img
https://firebasestorage.googleapis.com/v0/b/...
```

### After (クリーニング済み):
```
マーケティングとは何でしょうか。
```

---

## メタデータの活用

### 各チャンクに付加する情報
```typescript
{
  category: 'BtoC', // BtoB or BtoC
  sheetName: 'M6CH01001',
  section: 'Lecture',
  type: 'description',
  messageId: 'msg_001',
  content: 'クリーニング済みテキスト',
  context: '前後のメッセージ',
  metadata: {
    hasChoices: false,
    url: null, // 画像URLがあった場合の元URL
    skill: null,
    exp: null
  }
}
```

---

## 実装ファイル

### `src/lib/text-cleaner.ts`
- タグ除去ロジック
- テキスト正規化
- ユーティリティ関数

### `src/lib/chunker.ts`
- チャンク分割ロジック
- トークンカウント
- 文脈付加

### `scripts/test-cleaning.ts`
- クリーニングテスト
- Before/After比較

---

この戦略で、182シート × 7000文字の汚いデータを
クリーンなRAG用データに変換できます。
