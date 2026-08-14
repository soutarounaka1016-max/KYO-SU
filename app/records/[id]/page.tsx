import { notFound } from "next/navigation";
import { ExamAnalysisDetail } from "@/components/exam-analysis-detail";
import { examAnalyses, type ExamAnalysis } from "@/lib/exam-analysis";
import { examRecords, recordsBySubject, type ExamRecord } from "@/lib/exams";

export const dynamicParams = false;

export function generateStaticParams() {
  return examRecords.map((record) => ({ id: record.id }));
}

function createFallbackAnalysis(record: ExamRecord): ExamAnalysis {
  const subjectRecords = recordsBySubject(record.subject);
  const currentIndex = subjectRecords.findIndex((item) => item.id === record.id);
  const previous = currentIndex > 0 ? subjectRecords[currentIndex - 1] : undefined;
  const rankedSections = [...record.sections].sort(
    (a, b) => (b.score / b.maxScore) - (a.score / a.maxScore),
  );
  const strongest = rankedSections[0];
  const weakest = rankedSections.at(-1)!;
  const strongestRate = Math.round((strongest.score / strongest.maxScore) * 100);
  const weakestRate = Math.round((weakest.score / weakest.maxScore) * 100);

  return {
    recordId: record.id,
    englishLabel: `${record.year} ${record.type === "本試" ? "MAIN EXAM" : "RETEST"} · ${record.subject}`,
    ...(previous ? { previousChange: record.score - previous.score } : {}),
    headline: `${record.score}点。Notionに登録された基本分析を表示しています。`,
    lead: record.summary,
    leadHighlight: `最重要弱点は「${record.primaryWeakness}」です。`,
    ...(record.nationalAverage === undefined ? {
      nationalDataNotice: "全国平均点・設問別全国正答率は未確認です。確認できていない全国データは推測せず表示していません。",
    } : {}),
    observations: [
      {
        label: previous ? "前回からの変化" : "初回記録",
        title: previous
          ? `${record.score - previous.score >= 0 ? "+" : ""}${record.score - previous.score}点`
          : `${record.score}/${record.maxScore}点`,
        detail: previous
          ? `${previous.score}点から${record.score}点へ推移しました。`
          : `${record.subject}の比較基準になる最初の記録です。`,
        tone: previous && record.score < previous.score ? "attention" : "positive",
      },
      {
        label: "最高得点率の大問",
        title: `第${strongest.section}問 ${strongest.score}/${strongest.maxScore}`,
        detail: `得点率${strongestRate}%で、この試験で最も高い大問です。`,
        tone: "positive",
      },
      {
        label: "優先確認",
        title: `第${weakest.section}問 ${weakest.score}/${weakest.maxScore}`,
        detail: `得点率${weakestRate}%です。詳しい原因はChatGPTでの分析後に追記できます。`,
        tone: "attention",
      },
    ],
    strength: {
      title: `第${strongest.section}問`,
      label: `${strongest.score} / ${strongest.maxScore}（${strongestRate}%）`,
      detail: "Notionの大問別得点から自動判定した、得点率が最も高い大問です。",
    },
    weaknesses: [
      {
        rank: 1,
        name: record.primaryWeakness,
        detail: "Notionの「最重要弱点」に登録されている内容です。",
      },
      {
        rank: 2,
        name: `第${weakest.section}問`,
        detail: `得点率${weakestRate}%で、この試験の大問別得点率が最も低い部分です。`,
      },
      {
        rank: 3,
        name: "詳細分析待ち",
        detail: "設問別正答率などの詳しい分析は、ChatGPTで確認後に追加できます。",
      },
    ],
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = examRecords.find((item) => item.id === id);
  if (!record) notFound();

  const analysis = examAnalyses[id] ?? createFallbackAnalysis(record);
  return <ExamAnalysisDetail analysis={analysis} />;
}
