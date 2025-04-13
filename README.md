# ateaparty-instance-analyze

## 定期実行TypeScriptスクリプト

GitHub Actionsで定期実行されるTypeScriptスクリプトのサンプルプロジェクトです。

### 機能

- TypeScriptで書かれたサンプルスクリプト
- GitHub Actionsによる定期実行（毎日実行）
- 実行ログの保存
- Biomeによるリンティングとフォーマット

### セットアップ

```bash
# 依存関係のインストール
npm install

# スクリプトの実行
npm start
```

### 開発方法

1. `src/index.ts` を編集してスクリプトの機能を変更できます
2. `.github/workflows/scheduled-script.yml` を編集して実行スケジュールを変更できます

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

GitHub Actionsでは、PRやメインブランチへのプッシュ時に自動的にリンティングとフォーマットチェックが実行されます。メインブランチへのプッシュ時は、必要に応じて自動的に修正コミットが作成されます。

### スケジュール設定

GitHub Actionsのcron式でスケジュールを設定しています。デフォルトでは毎日UTC 0時（日本時間9時）に実行されます。

cron式の書式: `分 時 日 月 曜日`

例:
- `0 0 * * *`: 毎日0時に実行
- `0 */6 * * *`: 6時間ごとに実行
- `0 0 * * 1`: 毎週月曜日に実行

詳細は[GitHub Actionsのドキュメント](https://docs.github.com/ja/actions/using-workflows/events-that-trigger-workflows#schedule)を参照してください。
