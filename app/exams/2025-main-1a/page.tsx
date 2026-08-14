import Link from "next/link";
import { mainIaAnalysis } from "@/lib/exam-analysis";
import { examRecords, formatPracticeDate } from "@/lib/exams";

const record = examRecords.find((item) => item.id === "2025-main-1a")!;

export default function MainIaDetailPage() {
  const difference = record.score - record.nationalAverage!;

  return (
    <main className="detail-page">
      <div className="detail-topbar">
        <Link href="/" className="back-link">← ホームへ戻る</Link>
        <span>KYO-SU ANALYSIS</span>
      </div>

      <header className="detail-hero">
        <div>
          <p className="kicker">2025 MAIN EXAM · MATHEMATICS IA</p>
          <h1>2025本試<br />数学ⅠA</h1>
          <p className="header-copy">{formatPracticeDate(record.practicedAt)}に実施した1回目の分析</p>
        </div>
        <div className="detail-score-orb">
          <span>合計得点</span>
          <strong>{record.score}</strong>
          <small>/ {record.maxScore}</small>
        </div>
      </header>

      <section className="detail-stat-grid" aria-label="基本成績">
        <article className="detail-stat">
          <span>全国平均点</span>
          <strong>{record.nationalAverage!.toFixed(2)}</strong>
          <small>点</small>
        </article>
        <article className="detail-stat">
          <span>全国平均との差</span>
          <strong className="negative">{difference.toFixed(2)}</strong>
          <small>点</small>
        </article>
        <article className="detail-stat">
          <span>採点単位</span>
          <strong>{mainIaAnalysis.scoringUnits}</strong>
          <small>件</small>
        </article>
        <article className="detail-stat">
          <span>総合評価</span>
          <strong className="detail-evaluation">{record.evaluation}</strong>
        </article>
      </section>

      <section className="analysis-lead">
        <p className="section-number">KEY FINDING</p>
        <h2>44点だが、失点の約半分は全国でも難しい問題。</h2>
        <p>
          失点56点のうち26点は全国正答率30%未満でした。一方、全国の半分以上が正解した問題でも18点を落としており、ここを回収できれば
          <strong> {mainIaAnalysis.realisticTarget}点前後 </strong>
          が現実的な改善ラインです。
        </p>
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <div><p className="section-number">01</p><h2>大問別結果</h2></div>
          <p>得点／満点</p>
        </div>
        <div className="detail-section-grid">
          {record.sections.map((section) => {
            const rate = Math.round((section.score / section.maxScore) * 100);
            return (
              <article className="detail-section-card" key={section.section}>
                <div><span>第{section.section}問</span><strong>{section.score}<small>/{section.maxScore}</small></strong></div>
                <div className="detail-rate"><span>{rate}%</span><div className="bar-track"><div className="bar own" style={{ width: `${rate}%` }} /></div></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <div><p className="section-number">02</p><h2>失点の難度内訳</h2></div>
          <p>全国正答率別・計56点</p>
        </div>
        <div className="loss-card">
          <div className="loss-strip" aria-label="失点56点の全国正答率別内訳">
            {mainIaAnalysis.lossByCorrectRate.map((item) => (
              <div key={item.label} className={`loss-segment ${item.tone}`} style={{ width: `${(item.points / mainIaAnalysis.lostPoints) * 100}%` }} />
            ))}
          </div>
          <div className="loss-legend">
            {mainIaAnalysis.lossByCorrectRate.map((item) => (
              <div key={item.label}>
                <span className={`legend-dot ${item.tone}`} />
                <p>全国正答率 {item.label}</p>
                <strong>{item.points}点</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <div><p className="section-number">03</p><h2>優先して見る失点</h2></div>
          <p>全国正答率の高い順</p>
        </div>
        <div className="priority-list">
          {mainIaAnalysis.priorityMisses.map((item) => (
            <article className="priority-row" key={item.code}>
              <span className={`priority-badge ${item.priority === "最優先" ? "urgent" : "standard"}`}>{item.priority}</span>
              <div className="priority-copy">
                <strong>{item.code}</strong>
                <span>{item.topic}</span>
                <p>{item.detail}</p>
              </div>
              <div className="correct-rate"><span>全国正答率</span><strong>{item.correctRate.toFixed(2)}%</strong></div>
            </article>
          ))}
        </div>
      </section>

      <section className="detail-section two-column-detail">
        <article className="strength-card">
          <span className="insight-label">確認できた強み</span>
          <h2>{mainIaAnalysis.strength.topic}</h2>
          <strong>{mainIaAnalysis.strength.code} · 正答率 {mainIaAnalysis.strength.correctRate.toFixed(2)}%</strong>
          <p>{mainIaAnalysis.strength.detail}</p>
        </article>
        <div className="weakness-rankings">
          <p className="section-number">WEAKNESS TOP 3</p>
          {mainIaAnalysis.weaknesses.map((item) => (
            <article key={item.rank}>
              <span>0{item.rank}</span>
              <div><strong>{item.name}</strong><p>{item.detail}</p></div>
            </article>
          ))}
        </div>
      </section>

      <footer className="detail-footer">
        <Link href="/">← 4試験の一覧に戻る</Link>
        <span>KYO-SU v0.3</span>
      </footer>
    </main>
  );
}
