export type PriorityMiss = {
  code: string;
  correctRate: number;
  topic: string;
  detail: string;
  priority: "最優先" | "優先";
};

export const mainIaAnalysis = {
  scoringUnits: 39,
  lostPoints: 56,
  realisticTarget: 62,
  lossByCorrectRate: [
    { label: "70%以上", points: 5, tone: "critical" },
    { label: "50〜70%", points: 13, tone: "priority" },
    { label: "30〜50%", points: 12, tone: "review" },
    { label: "30%未満", points: 26, tone: "low" },
  ],
  priorityMisses: [
    {
      code: "第3問 ウ",
      correctRate: 77.34,
      topic: "図形の性質",
      detail: "相似な三角形を見つけ、相似比を使う問題。",
      priority: "最優先",
    },
    {
      code: "第3問 エ〜カ",
      correctRate: 73.95,
      topic: "図形の性質",
      detail: "相似から辺の関係式を作る問題。",
      priority: "最優先",
    },
    {
      code: "第1問 タ〜チ",
      correctRate: 59.54,
      topic: "図形と計量",
      detail: "正弦定理・円と三角形。",
      priority: "優先",
    },
    {
      code: "第2問 イ〜オ",
      correctRate: 59.34,
      topic: "二次関数",
      detail: "文章の条件を二次関数の式へ変換する問題。",
      priority: "優先",
    },
    {
      code: "第3問 キ〜ク",
      correctRate: 52.97,
      topic: "図形の性質",
      detail: "相似から得た式を使った辺の計算。",
      priority: "優先",
    },
    {
      code: "第2問 ナ〜ネ",
      correctRate: 50.22,
      topic: "データの分析",
      detail: "シミュレーションを使った統計的判断。",
      priority: "優先",
    },
  ] satisfies PriorityMiss[],
  strength: {
    code: "第2問 シ",
    correctRate: 26.29,
    topic: "二次関数",
    detail: "全国正答率30%未満の噴水問題で正解。",
  },
  weaknesses: [
    {
      rank: 1,
      name: "図形の性質",
      detail: "円周上の4点から相似を見つけ、相似比と辺の関係式へつなぐ処理。",
    },
    {
      rank: 2,
      name: "二次関数の文章題・パラメータ",
      detail: "文章条件を数式化し、グラフの変化から条件を判断する処理。",
    },
    {
      rank: 3,
      name: "分散・共分散・相関",
      detail: "計算だけでなく、各指標が表す意味を使った統計的判断。",
    },
  ],
};
