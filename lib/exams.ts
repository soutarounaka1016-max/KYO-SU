import { examRecordsData } from "./exams.generated";

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

export const examRecords: ExamRecord[] = examRecordsData.map((record) => ({
  ...record,
  sections: record.sections.map((section) => ({ ...section })),
})) as ExamRecord[];

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
