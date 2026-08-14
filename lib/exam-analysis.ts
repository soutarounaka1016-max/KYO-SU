export type PriorityMiss = {
  code: string;
  correctRate: number;
  topic: string;
  detail: string;
  priority: "最優先" | "優先" | "要復習";
};

export type ExamAnalysis = {
  recordId: string;
  englishLabel: string;
  scoringUnits?: number;
  previousChange?: number;
  headline: string;
  lead: string;
  leadHighlight: string;
  lossByCorrectRate?: Array<{
    label: string;
    points: number;
    tone: "critical" | "priority" | "review" | "low";
  }>;
  lostPoints?: number;
  rateSummary?: Array<{
    label: string;
    value: string;
    detail: string;
    tone: "positive" | "attention" | "neutral";
  }>;
  nationalDataNotice?: string;
  observations?: Array<{
    label: string;
    title: string;
    detail: string;
    tone: "positive" | "attention" | "neutral";
  }>;
  priorityMisses?: PriorityMiss[];
  strength: { title: string; label: string; detail: string };
  weaknesses: Array<{ rank: number; name: string; detail: string }>;
};

export const examAnalyses: Record<string, ExamAnalysis> = {
  "2025-main-1a": {
    recordId: "2025-main-1a",
    englishLabel: "2025 MAIN EXAM · MATHEMATICS IA",
    scoringUnits: 39,
    headline: "44点だが、失点の約半分は全国でも難しい問題。",
    lead: "失点56点のうち26点は全国正答率30%未満でした。一方、全国の半分以上が正解した問題でも18点を落としています。",
    leadHighlight: "ここを回収できれば62点前後が現実的な改善ラインです。",
    lostPoints: 56,
    lossByCorrectRate: [
      { label: "70%以上", points: 5, tone: "critical" },
      { label: "50〜70%", points: 13, tone: "priority" },
      { label: "30〜50%", points: 12, tone: "review" },
      { label: "30%未満", points: 26, tone: "low" },
    ],
    priorityMisses: [
      { code: "第3問 ウ", correctRate: 77.34, topic: "図形の性質", detail: "相似な三角形を見つけ、相似比を使う問題。", priority: "最優先" },
      { code: "第3問 エ〜カ", correctRate: 73.95, topic: "図形の性質", detail: "相似から辺の関係式を作る問題。", priority: "最優先" },
      { code: "第1問 タ〜チ", correctRate: 59.54, topic: "図形と計量", detail: "正弦定理・円と三角形。", priority: "優先" },
      { code: "第2問 イ〜オ", correctRate: 59.34, topic: "二次関数", detail: "文章の条件を二次関数の式へ変換する問題。", priority: "優先" },
      { code: "第3問 キ〜ク", correctRate: 52.97, topic: "図形の性質", detail: "相似から得た式を使った辺の計算。", priority: "優先" },
      { code: "第2問 ナ〜ネ", correctRate: 50.22, topic: "データの分析", detail: "シミュレーションを使った統計的判断。", priority: "優先" },
    ],
    strength: { title: "二次関数", label: "第2問 シ · 全国正答率26.29%", detail: "全国正答率30%未満の噴水問題で正解。" },
    weaknesses: [
      { rank: 1, name: "図形の性質", detail: "円周上の4点から相似を見つけ、相似比と辺の関係式へつなぐ処理。" },
      { rank: 2, name: "二次関数の文章題・パラメータ", detail: "文章条件を数式化し、グラフの変化から条件を判断する処理。" },
      { rank: 3, name: "分散・共分散・相関", detail: "計算だけでなく、各指標が表す意味を使った統計的判断。" },
    ],
  },
  "2025-retest-1a": {
    recordId: "2025-retest-1a",
    englishLabel: "2025 RETEST · MATHEMATICS IA",
    previousChange: 29,
    headline: "73点。本試から29点伸び、基本問題の回収力が上昇。",
    lead: "第1問は30点満点で、本試より安定して得点できました。一方、第3問の図形の性質は8/20点で、2回続けて最大の弱点です。",
    leadHighlight: "点数の上昇だけでなく、残った弱点もはっきりした試験です。",
    nationalDataNotice: "2025追試の全国平均点・設問別全国正答率は未確認です。確認できていない全国データは推測せず表示していません。",
    observations: [
      { label: "最大の改善", title: "本試から+29点", detail: "44点から73点へ上昇。基本問題の回収が安定しました。", tone: "positive" },
      { label: "満点大問", title: "第1問 30/30", detail: "基礎領域を取り切りました。", tone: "positive" },
      { label: "継続課題", title: "第3問 8/20", detail: "本試3/20から改善したものの、図形の性質は弱点として残っています。", tone: "attention" },
    ],
    strength: { title: "第1問を満点回収", label: "30 / 30", detail: "基礎〜標準問題の処理精度が本試から大きく改善。" },
    weaknesses: [
      { rank: 1, name: "図形の性質", detail: "2試験連続で最重要弱点。図形条件を関係式へ変換する処理。" },
      { rank: 2, name: "二次関数のパラメータ", detail: "パラメータに応じたグラフ変化と条件判断。" },
      { rank: 3, name: "複数段階の確率", detail: "場合分けが増えたときの事象整理と計算。" },
    ],
  },
  "2025-main-2bc": {
    recordId: "2025-main-2bc",
    englishLabel: "2025 MAIN EXAM · MATHEMATICS IIBC",
    scoringUnits: 47,
    headline: "75点の中身は、基本・標準処理がかなり強い。",
    lead: "全国正答率70%以上の問題で誤答はなく、50%以上の問題でも誤答はほぼ1件のみでした。失点は全国的にも難しい大問後半へ集中しています。",
    leadHighlight: "数学ⅡBC全体が弱いのではなく、終盤の条件整理が主な伸びしろです。",
    rateSummary: [
      { label: "正答率70%以上の誤答", value: "0件", detail: "多くの受験生が取る問題は回収できています。", tone: "positive" },
      { label: "正答率50%以上の誤答", value: "ほぼ1件", detail: "第1問セ・三角関数が主な優先失点です。", tone: "attention" },
      { label: "主な失点帯", value: "40%未満", detail: "全国的にも難しい大問終盤での失点が中心です。", tone: "neutral" },
    ],
    priorityMisses: [
      { code: "第1問 セ", correctRate: 59.61, topic: "三角関数", detail: "全国の半分以上が正解した、この試験で最優先の失点。", priority: "優先" },
      { code: "第6問 ス", correctRate: 36.81, topic: "ベクトル", detail: "図形条件を整理して判断する大問後半。", priority: "要復習" },
      { code: "第3問 セ", correctRate: 33.54, topic: "微積分", detail: "高得点だった大問で残った終盤の失点。", priority: "要復習" },
      { code: "第6問 シ", correctRate: 30.49, topic: "ベクトル", detail: "座標・ベクトル条件を組み合わせる問題。", priority: "要復習" },
    ],
    strength: { title: "微積分", label: "第3問 20 / 22", detail: "基本から標準処理を高い精度で得点。指数・対数も12/15点でした。" },
    weaknesses: [
      { rank: 1, name: "大問終盤の条件整理", detail: "存在条件・パラメータ条件・最後の判断で失点しやすい傾向。" },
      { rank: 2, name: "三角関数の終盤", detail: "第1問セが、全国正答率50%以上で落とした主な問題。" },
      { rank: 3, name: "ベクトル・複素数平面の最終判断", detail: "標準処理の後に条件をまとめて結論を出す部分。" },
    ],
  },
  "2025-retest-2bc": {
    recordId: "2025-retest-2bc",
    englishLabel: "2025 RETEST · MATHEMATICS IIBC",
    previousChange: 2,
    headline: "77点。数列は満点で、選択分野も高得点。",
    lead: "第1問15/15、第4問の数列16/16、ベクトル14/16、複素数平面13/16と、複数分野で安定しました。一方、第3問は10/22点でした。",
    leadHighlight: "70点台を維持しながら、積分の条件整理に改善余地が残っています。",
    nationalDataNotice: "2025追試の全国平均点・設問別全国正答率は未確認です。全国との比較や復習優先度は、信頼できるデータを確認できるまで表示しません。",
    observations: [
      { label: "満点大問", title: "数列 16/16", detail: "第4問は満点。安定した強みとして確認できます。", tone: "positive" },
      { label: "選択分野", title: "27/32点", detail: "ベクトル14/16、複素数平面13/16と高得点でした。", tone: "positive" },
      { label: "最大の失点", title: "第3問 10/22", detail: "絶対値を含む積分で、場合分けと条件整理に課題が残りました。", tone: "attention" },
    ],
    strength: { title: "数列・選択分野", label: "数列16/16 · ベクトル14/16 · 複素数13/16", detail: "複数の分野で高得点を維持できています。" },
    weaknesses: [
      { rank: 1, name: "絶対値を含む積分・場合分け", detail: "境界を見つけ、区間ごとに式を分ける条件整理。" },
      { rank: 2, name: "図形条件の座標化", detail: "図形の情報を座標やベクトルの式へ置き換える処理。" },
      { rank: 3, name: "大問終盤の条件整理", detail: "最後の設問で複数条件をまとめ、結論を選ぶ処理。" },
    ],
  },
};
