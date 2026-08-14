export type Subject = "数学ⅠA" | "数学ⅡBC";
export type ExamType = "本試" | "追試";

export type SectionScore = {
  section: number;
  score: number;
  maxScore: number;
};

export type ExamRecord = {
  id: string;
  name: string;
  year: number;
  type: ExamType;
  subject: Subject;
  attemptOrder: number;
  practicedAt: string;
  score: number;
  maxScore: number;
  nationalAverage?: number;
  sectionScoreNote?: string;
  evaluation: "良好" | "要改善";
  primaryWeakness: string;
  summary: string;
  sections: SectionScore[];
};

export const examRecords: ExamRecord[] = [
  {
    id: "2025-main-1a",
    name: "2025 本試 数学ⅠA",
    year: 2025,
    type: "本試",
    subject: "数学ⅠA",
    attemptOrder: 1,
    practicedAt: "2026-08-07",
    score: 44,
    maxScore: 100,
    nationalAverage: 53.51,
    evaluation: "要改善",
    primaryWeakness: "図形の性質",
    summary:
      "難問での失点が多い一方、全国正答率の高い相似処理にも取りこぼしがあった。",
    sections: [
      { section: 1, score: 19, maxScore: 30 },
      { section: 2, score: 9, maxScore: 30 },
      { section: 3, score: 3, maxScore: 20 },
      { section: 4, score: 13, maxScore: 20 },
    ],
  },
  {
    id: "2025-retest-1a",
    name: "2025 追試 数学ⅠA",
    year: 2025,
    type: "追試",
    subject: "数学ⅠA",
    attemptOrder: 2,
    practicedAt: "2026-08-13",
    score: 73,
    maxScore: 100,
    evaluation: "良好",
    primaryWeakness: "図形の性質",
    summary:
      "本試から29点上昇。第1問は満点だが、図形の性質は2回続けて弱点として残った。",
    sections: [
      { section: 1, score: 30, maxScore: 30 },
      { section: 2, score: 21, maxScore: 30 },
      { section: 3, score: 8, maxScore: 20 },
      { section: 4, score: 14, maxScore: 20 },
    ],
  },
  {
    id: "2025-main-2bc",
    name: "2025 本試 数学ⅡBC",
    year: 2025,
    type: "本試",
    subject: "数学ⅡBC",
    attemptOrder: 1,
    practicedAt: "2026-08-08",
    score: 70,
    maxScore: 100,
    nationalAverage: 51.56,
    sectionScoreNote:
      "大問別得点の合計は75点です。正式な総得点70点と5点差があるため、採点表の再確認が必要です。",
    evaluation: "良好",
    primaryWeakness: "大問終盤の条件整理",
    summary:
      "正式な総得点は70点。全国平均を18.44点上回った。大問別合計75点との差は再確認待ち。",
    sections: [
      { section: 1, score: 8, maxScore: 15 },
      { section: 2, score: 12, maxScore: 15 },
      { section: 3, score: 20, maxScore: 22 },
      { section: 4, score: 13, maxScore: 16 },
      { section: 6, score: 10, maxScore: 16 },
      { section: 7, score: 12, maxScore: 16 },
    ],
  },
  {
    id: "2025-retest-2bc",
    name: "2025 追試 数学ⅡBC",
    year: 2025,
    type: "追試",
    subject: "数学ⅡBC",
    attemptOrder: 2,
    practicedAt: "2026-08-14",
    score: 77,
    maxScore: 100,
    evaluation: "良好",
    primaryWeakness: "絶対値を含む積分・場合分け",
    summary:
      "70点台を維持。数列は満点で、難しい設定や終盤の判断が今後の伸びしろ。",
    sections: [
      { section: 1, score: 15, maxScore: 15 },
      { section: 2, score: 9, maxScore: 15 },
      { section: 3, score: 10, maxScore: 22 },
      { section: 4, score: 16, maxScore: 16 },
      { section: 6, score: 14, maxScore: 16 },
      { section: 7, score: 13, maxScore: 16 },
    ],
  },
];

export const recordsBySubject = (subject: Subject) =>
  examRecords
    .filter((record) => record.subject === subject)
    .sort((a, b) => a.attemptOrder - b.attemptOrder);

export const latestRecord = (subject: Subject) =>
  recordsBySubject(subject).at(-1)!;

export const previousDifference = (subject: Subject) => {
  const records = recordsBySubject(subject);
  return records.length > 1
    ? records.at(-1)!.score - records.at(-2)!.score
    : undefined;
};

export const formatPracticeDate = (date: string) => {
  const [, month, day] = date.split("-").map(Number);
  return `${month}月${day}日`;
};
