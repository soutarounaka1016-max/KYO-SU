# KYO-SU

共通テスト数学の演習結果を、問題年度ではなく「実際に解いた順番」で分析する個人用ダッシュボードです。

## 現在の範囲

- 2025年度の本試・追試、数学ⅠA・数学ⅡBCの4記録を表示
- 最新点と前回差
- 科目別の得点推移
- 本試の全国平均との差
- 最新回の大問別得点率
- 現在の強み・弱点の要約

初期版はNotionの確定済みデータを固定データとして表示します。Notion API接続と復習管理は次の段階で追加します。

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

表示用データは `lib/exams.ts` に分離しています。将来はこの層をサーバー側のNotion取得処理へ置き換えます。Notionトークンなどの秘密情報はリポジトリへコミットしません。
