import {
  analysisItems,
  examRecords,
  questionResultsByRecord,
  recordsBySubject,
  type AnalysisItem,
} from "./exams";

export type PriorityMiss = {
  code: string;
  correctRate?: number;
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

const itemsFor = (recordId: string, kind: AnalysisItem["kind"]) =>
  analysisItems
    .filter((item) => item.examId === recordId && item.kind === kind)
    .sort((a, b) => a.order - b.order);

const labelFor = (year: number, type: string, subject: string) =>
  `${year} ${type === "本試" ? "MAIN EXAM" : "RETEST"} · ${subject === "数学ⅠA" ? "MATHEMATICS IA" : "MATHEMATICS IIBC"}`;

const rateTone = (tone: AnalysisItem["tone"]): "positive" | "attention" | "neutral" =>
  tone === "positive" || tone === "attention" ? tone : "neutral";

const lossTone = (tone: AnalysisItem["tone"]): "critical" | "priority" | "review" | "low" =>
  tone === "critical" || tone === "priority" || tone === "review" ? tone : "low";

export const examAnalyses: Record<string, ExamAnalysis> = Object.fromEntries(
  examRecords.map((record) => {
    const heading = itemsFor(record.id, "見出し")[0];
    const lossItems = itemsFor(record.id, "失点帯").filter((item) => item.points !== undefined);
    const metricItems = itemsFor(record.id, "指標");
    const observationItems = itemsFor(record.id, "観察");
    const priorityItems = itemsFor(record.id, "優先失点");
    const strengthItem = itemsFor(record.id, "強み")[0];
    const weaknessItems = itemsFor(record.id, "弱点");
    const notice = itemsFor(record.id, "注記")[0];
    const subjectRecords = recordsBySubject(record.subject);
    const currentIndex = subjectRecords.findIndex((item) => item.id === record.id);
    const previous = currentIndex > 0 ? subjectRecords[currentIndex - 1] : undefined;

    const analysis: ExamAnalysis = {
      recordId: record.id,
      englishLabel: labelFor(record.year, record.type, record.subject),
      ...(record.type === "本試" ? { scoringUnits: questionResultsByRecord(record.id).length } : {}),
      ...(previous ? { previousChange: record.score - previous.score } : {}),
      headline: heading?.title ?? record.name,
      lead: heading?.detail ?? record.summary,
      leadHighlight: heading?.value ?? `最重要弱点は「${record.primaryWeakness}」です。`,
      ...(lossItems.length > 0 ? {
        lossByCorrectRate: lossItems.map((item) => ({
          label: item.label ?? item.title,
          points: item.points!,
          tone: lossTone(item.tone),
        })),
        lostPoints: lossItems.reduce((sum, item) => sum + item.points!, 0),
      } : {}),
      ...(metricItems.length > 0 ? {
        rateSummary: metricItems.map((item) => ({
          label: item.label ?? item.title,
          value: item.value ?? "未確認",
          detail: item.detail ?? "",
          tone: rateTone(item.tone),
        })),
      } : {}),
      ...(notice ? { nationalDataNotice: notice.detail ?? notice.title } : {}),
      ...(observationItems.length > 0 ? {
        observations: observationItems.map((item) => ({
          label: item.label ?? "分析",
          title: item.title,
          detail: item.detail ?? "",
          tone: rateTone(item.tone),
        })),
      } : {}),
      ...(priorityItems.length > 0 ? {
        priorityMisses: priorityItems.map((item) => ({
          code: item.code ?? item.title,
          ...(item.nationalCorrectRate === undefined ? {} : { correctRate: item.nationalCorrectRate }),
          topic: item.title,
          detail: item.detail ?? "",
          priority: item.priority ?? "要復習",
        })),
      } : {}),
      strength: {
        title: strengthItem?.title ?? "分析済み",
        label: strengthItem?.label ?? record.subject,
        detail: strengthItem?.detail ?? record.summary,
      },
      weaknesses: weaknessItems.length > 0
        ? weaknessItems.map((item, index) => ({
            rank: index + 1,
            name: item.title,
            detail: item.detail ?? "",
          }))
        : [{ rank: 1, name: record.primaryWeakness, detail: record.summary }],
    };

    return [record.id, analysis];
  }),
);
