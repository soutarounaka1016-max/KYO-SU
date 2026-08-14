# KYO-SU

共通テスト数学の演習結果を、問題年度ではなく「実際に解いた順番」で分析する個人用ダッシュボードです。

## 現在の範囲

- 2025年度の本試・追試、数学ⅠA・数学ⅡBCの4記録を表示
- 最新点と前回差
- 科目別の得点推移
- 4試験それぞれの合計得点・全国平均点
- 4試験それぞれの大問別得点／満点
- 本試の全国平均との差
- 数学ⅡBC本試の5点不一致を注意表示
- 4試験すべての試験別分析詳細ページ
- 本試は全国正答率、追試は大問結果・前回比較を中心に分析
- 各試験の優先失点、強み、弱点TOP3
- 現在の強み・弱点の要約

ChatGPTで分析し、Notion「演習記録」に保存した確定済みデータをGitHub Actionsの手動実行時に同期します。アプリ内での試験結果入力・AI分析・復習管理は行いません。

## 開発

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## 確認

```bash
npm run typecheck
npm run lint
npm run build
```

## 技術構成

- Next.js 16
- React 19
- TypeScript
- CSS（外部UIライブラリなし）

## データ方針

表示用データはデプロイ前に `scripts/sync-notion.mjs` がNotionから取得・検証し、`lib/exams.generated.ts` を生成します。NotionトークンとデータベースURLはGitHub Actions Secretsからだけ読み込み、リポジトリや公開サイトへ保存しません。取得または検証に失敗した場合はデプロイを停止し、現在公開中の正常なサイトを維持します。
