import Link from "next/link";
import type { ExamAnalysis, PriorityMiss } from "@/lib/exam-analysis";
import { examRecords, formatPracticeDate } from "@/lib/exams";

function priorityClass(priority: PriorityMiss["priority"]) {
  if (priority === "最優先") return "urgent";
  if (priority === "要復習") return "review";
  return "standard";
}

export function ExamAnalysisDetail({ analysis }: { analysis: ExamAnalysis }) {
  const record = examRecords.find((item) => item.id === analysis.recordId)!;
  const difference = record.nationalAverage === undefined ? undefined : record.score - record.nationalAverage;
  const sectionTotal = record.sections.reduce((sum, section) => sum + section.score, 0);

  return (
    <main className="detail-page">
      <div className="detail-topbar">
        <Link href="/" className="back-link">← ホームへ戻る</Link>
        <span>KYO-SU ANALYSIS</span>
      </div>

      <header className="detail-hero">
        <div>
          <p className="kicker">{analysis.englishLabel}</p>
          <h1>{record.year}{record.type}<br />{record.subject}</h1>
          <p className="header-copy">{formatPracticeDate(record.practicedAt)}に実施した{record.attemptOrder}回目の分析</p>
        </div>
        <div className="detail-score-orb">
          <span>合計得点</span><strong>{record.score}</strong><small>/ {record.maxScore}</small>
        </div>
      </header>

      <section className="detail-stat-grid" aria-label="基本成績">
        <article className="detail-stat">
          <span>全国平均点</span>
          <strong>{record.nationalAverage === undefined ? "未確認" : record.nationalAverage.toFixed(2)}</strong>
          {record.nationalAverage !== undefined && <small>点</small>}
        </article>
        <article className="detail-stat">
          <span>全国平均との差</span>
          <strong className={difference === undefined ? "muted-value" : difference >= 0 ? "positive" : "negative"}>
            {difference === undefined ? "—" : `${difference >= 0 ? "+" : ""}${difference.toFixed(2)}`}
          </strong>
          {difference !== undefined && <small>点</small>}
        </article>
        <article className="detail-stat">
          <span>{analysis.scoringUnits ? "採点単位" : "前回比"}</span>
          <strong className={analysis.previousChange !== undefined ? "positive" : ""}>
            {analysis.scoringUnits ?? `${analysis.previousChange! >= 0 ? "+" : ""}${analysis.previousChange}`}
          </strong>
          <small>{analysis.scoringUnits ? "件" : "点"}</small>
        </article>
        <article className="detail-stat"><span>総合評価</span><strong className="detail-evaluation">{record.evaluation}</strong></article>
      </section>

      <section className="analysis-lead">
        <p className="section-number">KEY FINDING</p>
        <h2>{analysis.headline}</h2>
        <p>{analysis.lead} <strong>{analysis.leadHighlight}</strong></p>
      </section>

      <section className="detail-section">
        <div className="section-heading"><div><p className="section-number">01</p><h2>大問別結果</h2></div><p>得点／満点</p></div>
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
        {record.sectionScoreNote && (
          <div className="detail-data-warning" role="note">
            <strong>大問別合計 {sectionTotal}/100 · 正式な総得点 {record.score}/100</strong><p>{record.sectionScoreNote}</p>
          </div>
        )}
      </section>

      {analysis.lossByCorrectRate && analysis.lostPoints && (
        <section className="detail-section">
          <div className="section-heading"><div><p className="section-number">02</p><h2>失点の難度内訳</h2></div><p>全国正答率別・計{analysis.lostPoints}点</p></div>
          <div className="loss-card">
            <div className="loss-strip" aria-label={`失点${analysis.lostPoints}点の全国正答率別内訳`}>
              {analysis.lossByCorrectRate.map((item) => <div key={item.label} className={`loss-segment ${item.tone}`} style={{ width: `${(item.points / analysis.lostPoints!) * 100}%` }} />)}
            </div>
            <div className="loss-legend">
              {analysis.lossByCorrectRate.map((item) => <div key={item.label}><span className={`legend-dot ${item.tone}`} /><p>全国正答率 {item.label}</p><strong>{item.points}点</strong></div>)}
            </div>
          </div>
        </section>
      )}

      {analysis.rateSummary && (
        <section className="detail-section">
          <div className="section-heading"><div><p className="section-number">02</p><h2>全国正答率から見た特徴</h2></div><p>本試の設問別分析</p></div>
          <div className="rate-summary-grid">
            {analysis.rateSummary.map((item) => <article className={`rate-summary-card ${item.tone}`} key={item.label}><span>{item.label}</span><strong>{item.value}</strong><p>{item.detail}</p></article>)}
          </div>
        </section>
      )}

      {analysis.nationalDataNotice && (
        <section className="detail-section">
          <div className="analysis-notice" role="note"><strong>全国データは未確認</strong><p>{analysis.nationalDataNotice}</p></div>
          {analysis.observations && (
            <div className="observation-grid">
              {analysis.observations.map((item) => <article className={`observation-card ${item.tone}`} key={item.label}><span>{item.label}</span><strong>{item.title}</strong><p>{item.detail}</p></article>)}
            </div>
          )}
        </section>
      )}

      {analysis.priorityMisses && (
        <section className="detail-section">
          <div className="section-heading"><div><p className="section-number">03</p><h2>優先して見る失点</h2></div><p>全国正答率の高い順</p></div>
          <div className="priority-list">
            {analysis.priorityMisses.map((item) => (
              <article className="priority-row" key={item.code}>
                <span className={`priority-badge ${priorityClass(item.priority)}`}>{item.priority}</span>
                <div className="priority-copy"><strong>{item.code}</strong><span>{item.topic}</span><p>{item.detail}</p></div>
                <div className="correct-rate"><span>全国正答率</span><strong>{item.correctRate.toFixed(2)}%</strong></div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="detail-section two-column-detail">
        <article className="strength-card"><span className="insight-label">確認できた強み</span><h2>{analysis.strength.title}</h2><strong>{analysis.strength.label}</strong><p>{analysis.strength.detail}</p></article>
        <div className="weakness-rankings">
          <p className="section-number">WEAKNESS TOP 3</p>
          {analysis.weaknesses.map((item) => <article key={item.rank}><span>0{item.rank}</span><div><strong>{item.name}</strong><p>{item.detail}</p></div></article>)}
        </div>
      </section>

      <footer className="detail-footer"><Link href="/">← 4試験の一覧に戻る</Link><span>KYO-SU v0.4</span></footer>
    </main>
  );
}
