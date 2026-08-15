import { analysisItemsData, examRecordsData, questionResultsData } from "./exams.generated";

export type Subject = "数学ⅠA" | "数学ⅡBC";
export type ExamType = "本試" | "追試";
export type Evaluation = "非常に良好" | "良好" | "標準" | "要改善" | "重点改善";

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
  evaluation?: Evaluation;
  primaryWeakness: string;
  summary: string;
  sections: SectionScore[];
};

export type AnalysisItemKind =
  | "見出し"
  | "失点帯"
  | "指標"
  | "観察"
  | "優先失点"
  | "強み"
  | "弱点"
  | "注記";

export type AnalysisItemTone =
  | "positive"
  | "attention"
  | "neutral"
  | "critical"
  | "priority"
  | "review"
  | "low";

export type AnalysisItem = {
  id: string;
  examId: string;
  name: string;
  kind: AnalysisItemKind;
  order: number;
  label?: string;
  title: string;
  detail?: string;
  value?: string;
  tone?: AnalysisItemTone;
  code?: string;
  nationalCorrectRate?: number;
  points?: number;
  priority?: "最優先" | "優先" | "要復習";
};

export type QuestionResult = {
  id: string;
  examId: string;
  name: string;
  year: number;
  type: ExamType;
  subject: Subject;
  attemptOrder: number;
  section: number;
  code: string;
  points: number;
  result: "正解" | "不正解";
  nationalCorrectRate?: number;
  field: string;
  topic: string;
  content: string;
  priority: "最優先" | "優先" | "要復習" | "低" | "強み" | "通常";
  aiAnalysis: string;
};

export const examRecords: ExamRecord[] = examRecordsData.map((record) => ({
  ...record,
  sections: record.sections.map((section) => ({ ...section })),
})) as ExamRecord[];

export const questionResults: readonly QuestionResult[] =
  questionResultsData as unknown as readonly QuestionResult[];

export const analysisItems: readonly AnalysisItem[] =
  analysisItemsData as unknown as readonly AnalysisItem[];

export const questionResultsByRecord = (recordId: string) =>
  questionResults
    .filter((question) => question.examId === recordId)
    .sort((a, b) => a.section - b.section || a.code.localeCompare(b.code, "ja"));

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
