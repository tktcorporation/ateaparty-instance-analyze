# ateaparty-instance-analyze

## VRChatグループインスタンス情報取得ツール

VRChatのグループのインスタンス情報を取得し、JSONとして保存するツールです。GitHub Actionsで定期実行され、結果はリポジトリに自動的にコミットされます。

### 機能

- VRChatグループのインスタンス情報の取得
- 認証トークンを使用したAPI接続
- 定期的な情報収集（GitHub Actions）
- 結果のJSON形式での保存
- 履歴データの蓄積（タイムゾーン付き日時をキーとして保存）
- 日次データの保存（日付ごとに最新状態を保存）
- GitHub Actionsによる自動コミット・プッシュ
- Biomeによるリンティングとフォーマット

### セットアップ

```bash
# 依存関係のインストール
npm install

# スクリプトの実行
npm start

# 環境変数を指定して実行
VRC_AUTH_TOKEN=your_token npm start
```

### 認証情報の設定

VRChat APIにアクセスするには認証トークンが必要です。以下の方法で設定できます：

1. 開発環境での実行時：
   - `.env`ファイルを作成し、`VRC_AUTH_TOKEN=あなたの認証トークン`を設定
   - または直接環境変数を設定: `export VRC_AUTH_TOKEN=あなたの認証トークン`

2. GitHub Actionsでの実行時：
   - リポジトリの「Settings > Secrets and variables > Actions」で`VRC_AUTH_TOKEN`という名前のSecretを作成し、VRChatの認証トークンを設定

### VRChat認証トークンの取得方法

1. VRChatのウェブサイト(https://vrchat.com)にログイン
2. ブラウザの開発者ツールを開く（F12またはCtrl+Shift+I）
3. Application（アプリケーション）タブを開く
4. Cookies > https://vrchat.com を選択
5. `auth`という名前のCookieの値をコピー
6. この値を`VRC_AUTH_TOKEN`として設定

### 出力ファイル

スクリプトは3種類のファイルを出力します：

1. **単発のログファイル**：
   - ファイル名：`logs/instances-{グループID}-{日時}.json`
   - 内容：実行時のインスタンス情報のスナップショット
   - 注意：このファイルはGitで管理されません

2. **履歴ファイル**：
   - ファイル名：`data/instance-history.json`
   - 内容：すべての実行結果を蓄積したデータ
   - 形式：`{ "日時（ISO形式・タイムゾーン付き）": インスタンスデータ, ... }`
   - 特徴：Gitで管理され、実行ごとに更新されます

3. **日次ファイル**：
   - ファイル名：`data/instances-{groupId}-{YYYY-MM-DD}.json`
   - 内容：その日の最新のインスタンス情報
   - 特徴：日付ごとに1つのファイルが作成され、同じ日に複数回実行しても最新の情報で上書きされます

### 環境変数による設定

以下の環境変数でスクリプトの動作をカスタマイズできます：

| 環境変数 | 説明 | デフォルト値 |
|---------|------|------------|
| `VRC_AUTH_TOKEN` | VRChatの認証トークン | なし（必須） |
| `GROUP_ID` | 取得するVRChatグループのID | 'grp_e7e50ff7-a7b4-4645-8640-9292957b52fb' |
| `OUTPUT_BASE_DIR` | 出力ファイルの基準ディレクトリ | カレントディレクトリ |
| `HISTORY_FILE` | 履歴ファイルの名前 | 'instance-history.json' |
| `MOCK_RESPONSE` | モックレスポンスを使用するか | 未設定（'true'を設定するとモードになる） |

### GitHub Actionsによる自動実行とコミット

このツールはGitHub Actionsで定期実行され、以下の流れで動作します：

1. 毎日指定した時間にスクリプトが実行されます
2. インスタンス情報が取得され、`data/`ディレクトリに保存されます
3. ファイルに変更があった場合のみ、自動的にコミットとプッシュが行われます
4. 変更がない場合（データが前回と同じ場合）はコミットされません

設定は`.github/workflows/scheduled-script.yml`で行います。

### 開発方法

1. `src/index.ts`を編集してスクリプトの機能を変更できます
2. `.github/workflows/scheduled-script.yml`を編集して実行スケジュールを変更できます

### モック機能

API接続をせずにテストを行いたい場合は、環境変数`MOCK_RESPONSE=true`を設定することで、モックデータを使用できます。GitHub Actionsのワークフローファイルで該当行のコメントを解除するだけです。

### リンティングとフォーマット

Biomeを使用してコードのリンティングとフォーマットを行います。

```bash
# リンティング
npm run lint

# リンティング（自動修正）
npm run lint:fix

# フォーマットチェック
npm run format

# フォーマット適用
npm run format:fix
```

### スケジュール設定

GitHub Actionsのcron式でスケジュールを設定しています。デフォルトでは毎日UTC 0時（日本時間9時）に実行されます。

cron式の書式: `分 時 日 月 曜日`

例:
- `0 0 * * *`: 毎日0時に実行
- `0 */6 * * *`: 6時間ごとに実行
- `0 0 * * 1`: 毎週月曜日に実行

詳細は[GitHub Actionsのドキュメント](https://docs.github.com/ja/actions/using-workflows/events-that-trigger-workflows#schedule)を参照してください。
