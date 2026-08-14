import { ExamAnalysisDetail } from "@/components/exam-analysis-detail";
import { examAnalyses } from "@/lib/exam-analysis";

export default function Page() {
  return <ExamAnalysisDetail analysis={examAnalyses["2025-main-2bc"]} />;
}
