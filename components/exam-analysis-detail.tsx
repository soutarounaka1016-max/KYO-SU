import Link from "next/link";
import type { ExamAnalysis, PriorityMiss } from "@/lib/exam-analysis";
import { examRecords, formatPracticeDate, questionResultsByRecord } from "@/lib/exams";
import styles from "./question-analysis.module.css";

function priorityClass(priority: PriorityMiss["priority"]) {
  if (priority === "最優先") return "urgent";
  if (priority === "要復習") return "review";
  return "standard";
}

export function ExamAnalysisDetail({ analysis }: { analysis: ExamAnalysis }) {
  const record = examRecords.find((item) => item.id === analysis.recordId)!;
  const questions = questionResultsByRecord(record.id);
  const correctQuestions = questions.filter((question) => question.result === "正解");
  const missedQuestions = questions
    .filter((question) => question.result === "不正解")
    .sort((a, b) => b.nationalCorrectRate - a.nationalCorrectRate);
  const questionPoints = questions.reduce((sum, question) => sum + question.points, 0);
  const earnedQuestionPoints = correctQuestions.reduce((sum, question) => sum + question.points, 0);
  const averageNationalRate = questions.length > 0
    ? questions.reduce((sum, question) => sum + question.nationalCorrectRate, 0) / questions.length
    : undefined;
  const fields = Array.from(new Set(questions.map((question) => question.field)))
    .map((field) => {
      const fieldQuestions = questions.filter((question) => question.field === field);
      const maxPoints = fieldQuestions.reduce((sum, question) => sum + question.points, 0);
      const earnedPoints = fieldQuestions
        .filter((question) => question.result === "正解")
        .reduce((sum, question) => sum + question.points, 0);
      return {
        field,
        earnedPoints,
        maxPoints,
        rate: maxPoints === 0 ? 0 : Math.round((earnedPoints / maxPoints) * 100),
      };
    })
    .sort((a, b) => a.rate - b.rate);
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
          <span>{analysis.scoringUnits !== undefined ? "採点単位" : analysis.previousChange !== undefined ? "前回比" : "科目内演習"}</span>
          <strong className={analysis.previousChange !== undefined && analysis.previousChange >= 0 ? "positive" : ""}>
            {analysis.scoringUnits !== undefined
              ? analysis.scoringUnits
              : analysis.previousChange !== undefined
                ? `${analysis.previousChange >= 0 ? "+" : ""}${analysis.previousChange}`
                : record.attemptOrder}
          </strong>
          <small>{analysis.scoringUnits !== undefined ? "件" : analysis.previousChange !== undefined ? "点" : "回目"}</small>
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

      <section className="detail-section">
        <div className="section-heading">
          <div><p className="section-number">NOTION DATA</p><h2>設問別分析</h2></div>
          <p>{questions.length > 0 ? `${questions.length}件を同期` : "設問データ未登録"}</p>
        </div>

        {questions.length === 0 ? (
          <div className="analysis-notice" role="note">
            <strong>この試験の設問データはまだありません</strong>
            <p>Notionの設問分析に追加して次回同期すると、ここへ自動表示されます。全国正答率などは推測しません。</p>
          </div>
        ) : (
          <div className={styles.analysis}>
            <div className={styles.summaryGrid}>
              <article><span>設問数</span><strong>{questions.length}</strong><small>件</small></article>
              <article><span>正解／不正解</span><strong>{correctQuestions.length}<small> / {missedQuestions.length}</small></strong><small>件</small></article>
              <article><span>設問別回収点</span><strong>{earnedQuestionPoints}<small> / {questionPoints}</small></strong><small>点</small></article>
              <article><span>全国正答率の平均</span><strong>{averageNationalRate?.toFixed(1)}</strong><small>%</small></article>
            </div>

            <div className={styles.blockHeading}>
              <div><span>FIELD BREAKDOWN</span><h3>分野別の得点率</h3></div>
              <p>低い分野から表示</p>
            </div>
            <div className={styles.fieldGrid}>
              {fields.map((field) => (
                <article key={field.field}>
                  <div><strong>{field.field}</strong><span>{field.earnedPoints}/{field.maxPoints}点</span></div>
                  <div className={styles.fieldTrack}><span style={{ width: `${field.rate}%` }} /></div>
                  <b>{field.rate}%</b>
                </article>
              ))}
            </div>

            <div className={styles.blockHeading}>
              <div><span>PRIORITY MISSES</span><h3>全国正答率が高い取りこぼし</h3></div>
              <p>上位8件</p>
            </div>
            {missedQuestions.length === 0 ? (
              <div className={styles.emptySuccess}>登録された設問はすべて正解です。</div>
            ) : (
              <div className={styles.missList}>
                {missedQuestions.slice(0, 8).map((question) => (
                  <article key={question.id}>
                    <span className={styles.priority}>{question.priority}</span>
                    <div><strong>第{question.section}問 {question.code}</strong><p>{question.field}{question.topic ? ` · ${question.topic}` : ""}</p></div>
                    <div><span>全国正答率</span><strong>{question.nationalCorrectRate.toFixed(2)}%</strong></div>
                  </article>
                ))}
              </div>
            )}

            <details className={styles.allQuestions}>
              <summary>全{questions.length}件の設問データを見る</summary>
              <div className={styles.questionList}>
                {questions.map((question) => (
                  <article key={question.id} className={question.result === "正解" ? styles.correct : styles.incorrect}>
                    <div className={styles.questionTop}>
                      <span>{question.result}</span>
                      <strong>第{question.section}問 {question.code}</strong>
                      <small>{question.points}点 · 全国正答率 {question.nationalCorrectRate.toFixed(2)}%</small>
                    </div>
                    <div className={styles.questionMeta}>
                      <span>{question.field}</span>
                      {question.topic && <span>{question.topic}</span>}
                      <span>{question.priority}</span>
                    </div>
                    {question.content && <p>{question.content}</p>}
                    {question.aiAnalysis && <p className={styles.aiNote}><strong>Notion分析：</strong>{question.aiAnalysis}</p>}
                  </article>
                ))}
              </div>
            </details>
          </div>
        )}
      </section>

      <section className="detail-section two-column-detail">
        <article className="strength-card"><span className="insight-label">確認できた強み</span><h2>{analysis.strength.title}</h2><strong>{analysis.strength.label}</strong><p>{analysis.strength.detail}</p></article>
        <div className="weakness-rankings">
          <p className="section-number">WEAKNESS TOP 3</p>
          {analysis.weaknesses.map((item) => <article key={item.rank}><span>0{item.rank}</span><div><strong>{item.name}</strong><p>{item.detail}</p></div></article>)}
        </div>
      </section>

      <footer className="detail-footer"><Link href="/">← {examRecords.length}試験の一覧に戻る</Link><span>KYO-SU v0.9</span></footer>
    </main>
  );
}
