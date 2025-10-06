# Google Sheets API セットアップガイド

## 概要
このガイドでは、Google Sheets APIを有効化し、APIキーを取得する手順を説明します。

---

## ステップ1: Google Cloud Console にアクセス

### 1.1 Google Cloud Console を開く
https://console.cloud.google.com/

### 1.2 ログイン
Googleアカウントでログイン

---

## ステップ2: プロジェクトの作成（または選択）

### 2.1 新規プロジェクト作成（初めての場合）

1. 画面上部の **プロジェクト選択** をクリック
2. **新しいプロジェクト** をクリック
3. 以下を入力：

| 項目 | 値 |
|------|-----|
| **プロジェクト名** | `marketing-chatbot` |
| **組織** | なし（個人の場合） |
| **場所** | 組織なし |

4. **作成** をクリック
5. プロジェクト作成完了まで待機（数秒）

### 2.2 既存プロジェクトを使用する場合

- 既存のプロジェクトを選択

---

## ステップ3: Google Sheets API の有効化

### 3.1 APIライブラリを開く

1. 左上のハンバーガーメニュー（≡）をクリック
2. **APIとサービス** → **ライブラリ** をクリック

または、直接アクセス：
https://console.cloud.google.com/apis/library

### 3.2 Google Sheets API を検索

1. 検索ボックスに `Google Sheets API` と入力
2. **Google Sheets API** をクリック
3. **有効にする** をクリック

有効化完了まで数秒待機

---

## ステップ4: APIキーの作成

### 4.1 認証情報ページを開く

1. 左上のハンバーガーメニュー（≡）をクリック
2. **APIとサービス** → **認証情報** をクリック

または、直接アクセス：
https://console.cloud.google.com/apis/credentials

### 4.2 APIキーを作成

1. 画面上部の **+ 認証情報を作成** をクリック
2. **APIキー** を選択
3. APIキーが作成され、ポップアップに表示されます

```
APIキーを作成しました
AIzaSyC...（長い文字列）

キーを制限   コピー   閉じる
```

4. **コピー** をクリックして、APIキーをコピー
5. 一旦、安全な場所に保存（メモ帳など）

⚠️ **重要**: このキーは後から確認できますが、今コピーしておくのが確実です

---

## ステップ5: APIキーの制限（セキュリティ強化）

### 5.1 キーの制限画面を開く

1. ポップアップの **キーを制限** をクリック
   または
2. 認証情報ページで作成したAPIキーをクリック

### 5.2 アプリケーションの制限

**「アプリケーションの制限」** セクション：

#### 開発環境（ローカル）
- **なし** を選択（開発時のみ）

#### 本番環境（推奨）
- **HTTPリファラー（ウェブサイト）** を選択
- **ウェブサイトの制限** に以下を追加：
  ```
  https://your-vercel-app.vercel.app/*
  ```

### 5.3 APIの制限

**「APIの制限」** セクション：

1. **キーを制限** を選択
2. **APIを選択** をクリック
3. **Google Sheets API** にチェック
4. **OK** をクリック

### 5.4 保存

画面下部の **保存** をクリック

---

## ステップ6: スプレッドシートの共有設定

### 6.1 スプレッドシートを開く

https://docs.google.com/spreadsheets/d/1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk/edit

### 6.2 共有設定を確認

1. 右上の **共有** をクリック
2. **一般的なアクセス** を確認

#### パターン1: 組織内限定
```
組織内の全員
閲覧者
```
→ APIキーで読み取り可能

#### パターン2: リンクを知っている全員
```
リンクを知っている全員
閲覧者
```
→ APIキーで読み取り可能

#### パターン3: 制限付き（プライベート）
```
制限付き
特定のユーザーのみ
```
→ **サービスアカウント**が必要（後述）

⚠️ **注意**: まずは「リンクを知っている全員」で開始することを推奨

---

## ステップ7: ローカル環境の設定

### 7.1 `.env.local` にAPIキーを設定

```bash
# Google Sheets API
GOOGLE_SHEETS_API_KEY=AIzaSyC...（取得したAPIキー）
GOOGLE_SHEETS_SPREADSHEET_ID=1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk
```

### 7.2 開発サーバーを再起動

```bash
npm run dev
```

---

## ステップ8: 動作確認（オプション）

### 8.1 簡単な接続テスト

以下のURLをブラウザで開く（APIキーを置き換え）：

```
https://sheets.googleapis.com/v4/spreadsheets/1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk?key=AIzaSyC...
```

**成功時の応答**:
```json
{
  "spreadsheetId": "1fxu0TE7zDafJtNBbNohpCrWoO3NQuIVTkS5qohPMiPk",
  "properties": {
    "title": "...",
    ...
  },
  "sheets": [...]
}
```

**エラー時の応答**:
```json
{
  "error": {
    "code": 403,
    "message": "The caller does not have permission",
    ...
  }
}
```
→ スプレッドシートの共有設定を確認

---

## トラブルシューティング

### エラー: "API key not valid"

**原因**: APIキーが正しくない

**解決策**:
1. Google Cloud Consoleで認証情報を再確認
2. APIキーをコピー＆ペーストし直す
3. 余分なスペースがないか確認

### エラー: "The caller does not have permission"

**原因**: スプレッドシートが非公開

**解決策**:
1. スプレッドシートの共有設定を「リンクを知っている全員」に変更
2. または、サービスアカウントを使用（後述）

### エラー: "Google Sheets API has not been used in project..."

**原因**: Google Sheets APIが有効化されていない

**解決策**:
1. ステップ3に戻る
2. Google Sheets APIを有効化

---

## サービスアカウント方式（プライベートスプレッドシート用）

プライベートなスプレッドシートにアクセスする場合は、サービスアカウントを使用します。

### サービスアカウント作成手順

#### 1. サービスアカウント作成
1. Google Cloud Console → **APIとサービス** → **認証情報**
2. **+ 認証情報を作成** → **サービスアカウント**
3. サービスアカウント名: `chatbot-sheets-reader`
4. **作成して続行** → **完了**

#### 2. JSONキーの作成
1. 作成したサービスアカウントをクリック
2. **キー** タブ → **鍵を追加** → **新しい鍵を作成**
3. **JSON** を選択 → **作成**
4. JSONファイルがダウンロードされます

#### 3. スプレッドシートに共有
1. ダウンロードしたJSONファイルを開く
2. `client_email` をコピー
   ```json
   {
     "client_email": "chatbot-sheets-reader@project-id.iam.gserviceaccount.com"
   }
   ```
3. スプレッドシートの **共有** をクリック
4. `client_email` を追加（閲覧者として）

#### 4. 環境変数設定
```bash
# .env.local
GOOGLE_SERVICE_ACCOUNT_EMAIL=chatbot-sheets-reader@project-id.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

⚠️ **注意**: サービスアカウント方式は、APIキー方式より複雑ですが、よりセキュアです。

---

## まとめ

### APIキー方式（推奨・簡単）
✅ セットアップが簡単
✅ スプレッドシートを「リンクを知っている全員」に設定
⚠️ APIキーは制限をかける

### サービスアカウント方式（セキュア）
✅ スプレッドシートをプライベートに保てる
✅ よりセキュア
❌ セットアップがやや複雑

---

## 次のステップ

Google Sheets API設定が完了したら：

1. **データ取得スクリプト作成**
2. **スプレッドシートからのデータ読み込み**
3. **Gemini Embedding APIでベクトル化**
4. **Supabaseに投入**

---

## 参考リンク

- Google Sheets API: https://developers.google.com/sheets/api
- Google Cloud Console: https://console.cloud.google.com/
- API キーのベストプラクティス: https://cloud.google.com/docs/authentication/api-keys
