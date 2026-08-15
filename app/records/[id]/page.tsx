import { notFound } from "next/navigation";
import { ExamAnalysisDetail } from "@/components/exam-analysis-detail";
import { examAnalyses } from "@/lib/exam-analysis";
import { examRecords } from "@/lib/exams";

export const dynamicParams = false;

export function generateStaticParams() {
  return examRecords.map((record) => ({ id: record.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = examRecords.find((item) => item.id === id);
  const analysis = examAnalyses[id];
  if (!record || !analysis) notFound();

  return <ExamAnalysisDetail analysis={analysis} />;
}
