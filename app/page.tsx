import Link from "next/link";
import {
  examRecords,
  formatPracticeDate,
  latestRecord,
  previousDifference,
  recordsBySubject,
  type ExamRecord,
  type Subject,
} from "@/lib/exams";

const subjects: Subject[] = ["数学ⅠA", "数学ⅡBC"];

function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

function ScoreCard({ subject }: { subject: Subject }) {
  const record = latestRecord(subject);
  const difference = previousDifference(subject) ?? 0;

  return (
    <article className="card score-card">
      <div className="eyebrow-row">
        <span className={`subject-dot ${subject === "数学ⅠA" ? "ia" : "iibc"}`} />
        <span>{subject} 最新</span>
      </div>
      <div className="score-line">
        <strong>{record.score}</strong>
        <span>/ {record.maxScore}</span>
      </div>
      <div className="card-meta">
        <span>{record.year} {record.type}</span>
        <span className="positive">前回比 +{difference}</span>
      </div>
    </article>
  );
}

function TrendChart({ subject }: { subject: Subject }) {
  const records = recordsBySubject(subject);
  const colorClass = subject === "数学ⅠA" ? "trend-ia" : "trend-iibc";
  const [first, latest] = records;
  const y = (score: number) => 102 - score;

  return (
    <article className="trend-card">
      <div className="trend-heading">
        <div>
          <p className="trend-subject">{subject}</p>
          <p className="muted">科目内演習順</p>
        </div>
        <p className="trend-score">
          {first.score} <span>→</span> {latest.score}
        </p>
      </div>
      <svg
        className={`trend-chart ${colorClass}`}
        viewBox="0 0 420 120"
        role="img"
        aria-label={`${subject}は${first.score}点から${latest.score}点へ推移`}
      >
        {[25, 50, 75, 100].map((value) => (
          <line key={value} x1="32" y1={y(value)} x2="392" y2={y(value)} className="grid-line" />
        ))}
        <path d={`M62 ${y(first.score)} L362 ${y(latest.score)}`} className="score-path" />
        <circle cx="62" cy={y(first.score)} r="6" className="score-point" />
        <circle cx="362" cy={y(latest.score)} r="6" className="score-point" />
        <text x="62" y={y(first.score) - 12} textAnchor="middle">{first.score}</text>
        <text x="362" y={y(latest.score) - 12} textAnchor="middle">{latest.score}</text>
      </svg>
      <div className="chart-labels">
        {records.map((record) => (
          <span key={record.id}>
            {record.attemptOrder}回目・{record.type}<br />
            <small>{formatPracticeDate(record.practicedAt)}</small>
          </span>
        ))}
      </div>
    </article>
  );
}

function ComparisonRow({ record }: { record: ExamRecord }) {
  if (record.nationalAverage === undefined) return null;
  const difference = record.score - record.nationalAverage;

  return (
    <div className="comparison-row">
      <div className="comparison-label">
        <strong>{record.subject}</strong>
        <span>{record.year} {record.type}</span>
      </div>
      <div className="bar-stack">
        <div className="bar-line">
          <span>自分</span>
          <div className="bar-track"><div className="bar own" style={{ width: `${record.score}%` }} /></div>
          <strong>{record.score}</strong>
        </div>
        <div className="bar-line">
          <span>全国</span>
          <div className="bar-track"><div className="bar national" style={{ width: `${record.nationalAverage}%` }} /></div>
          <strong>{record.nationalAverage.toFixed(2)}</strong>
        </div>
      </div>
      <span className={`difference ${difference >= 0 ? "positive" : "negative"}`}>
        {difference >= 0 ? "+" : ""}{difference.toFixed(2)}点
      </span>
    </div>
  );
}

function ExamBreakdownCard({ record }: { record: ExamRecord }) {
  const sectionTotal = record.sections.reduce((sum, section) => sum + section.score, 0);
  const sectionMaxTotal = record.sections.reduce((sum, section) => sum + section.maxScore, 0);
  const difference = record.nationalAverage === undefined
    ? undefined
    : record.score - record.nationalAverage;

  return (
    <article className="card section-card">
      <div className="section-card-head">
        <div>
          <span className="pill">{record.year} {record.type}</span>
          <h3>{record.subject}</h3>
        </div>
        <div className="section-total-wrap">
          <span>合計得点</span>
          <strong className="section-total">{record.score}<small>/{record.maxScore}</small></strong>
        </div>
      </div>
      <div className="exam-metrics">
        <div>
          <span>全国平均点</span>
          <strong>{record.nationalAverage === undefined ? "未確認" : `${record.nationalAverage.toFixed(2)}点`}</strong>
        </div>
        <div>
          <span>全国平均との差</span>
          <strong className={difference === undefined ? "muted-value" : difference >= 0 ? "positive" : "negative"}>
            {difference === undefined ? "—" : `${difference >= 0 ? "+" : ""}${difference.toFixed(2)}点`}
          </strong>
        </div>
      </div>
      <div className="section-list-head">
        <span>大問ごとの得点／満点</span>
        <strong>合計 {sectionTotal}/{sectionMaxTotal}</strong>
      </div>
      <div className="section-bars">
        {record.sections.map((section) => {
          const rate = Math.round((section.score / section.maxScore) * 100);
          return (
            <div className="section-bar-row" key={section.section}>
              <span>第{section.section}問</span>
              <div className="bar-track"><div className="bar own" style={{ width: `${rate}%` }} /></div>
              <strong>{section.score}/{section.maxScore}</strong>
            </div>
          );
        })}
      </div>
      {record.sectionScoreNote && (
        <div className="score-warning" role="note">
          <strong>5点の不一致</strong>
          <p>{record.sectionScoreNote}</p>
        </div>
      )}
      <div className="weakness-box">
        <span>最重要弱点</span>
        <strong>{record.primaryWeakness}</strong>
      </div>
      <Link href={`/exams/${record.id}`} className="detail-link">
        詳細分析を見る <span>→</span>
      </Link>
    </article>
  );
}

export default function Home() {
  const latestDate = [...examRecords].sort((a, b) => b.practicedAt.localeCompare(a.practicedAt))[0].practicedAt;
  const average = examRecords.reduce((sum, record) => sum + record.score, 0) / examRecords.length;
  const mainRecords = examRecords.filter((record) => record.type === "本試");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="#top" className="brand" aria-label="KYO-SU ホーム">
          <span className="brand-mark">K</span>
          <span>KYO-SU</span>
        </a>
        <nav aria-label="メインナビゲーション">
          <a href="#top" className="nav-link active"><span>⌂</span>ホーム</a>
          <a href="#history" className="nav-link"><span>↗</span>得点推移</a>
          <a href="#breakdown" className="nav-link"><span>◇</span>得点内訳</a>
        </nav>
        <div className="sidebar-note">
          <span className="status-dot" />
          <div>
            <strong>固定データ版</strong>
            <p>Notion接続は次の段階</p>
          </div>
        </div>
      </aside>

      <main id="top" className="main-content">
        <header className="page-header">
          <div>
            <p className="kicker">COMMON TEST MATH</p>
            <h1>数学の伸びを、正しく見る。</h1>
            <p className="header-copy">問題年度ではなく、実際に解いた順番で成長を分析します。</p>
          </div>
          <div className="date-chip">
            <span>最終演習</span>
            <strong>{formatPracticeDate(latestDate)}</strong>
          </div>
        </header>

        <section className="score-grid" aria-label="最新状況">
          {subjects.map((subject) => <ScoreCard key={subject} subject={subject} />)}
          <article className="card score-card compact-stat">
            <div className="eyebrow-row"><span className="subject-dot neutral" />全演習</div>
            <div className="score-line"><strong>{examRecords.length}</strong><span>回</span></div>
            <div className="card-meta"><span>平均点</span><span>{average.toFixed(1)}点</span></div>
          </article>
        </section>

        <section id="history" className="section-block">
          <div className="section-heading">
            <div>
              <p className="section-number">01</p>
              <h2>得点推移</h2>
            </div>
            <p>全4試験・科目内演習順</p>
          </div>
          <div className="trend-grid">
            {subjects.map((subject) => <TrendChart key={subject} subject={subject} />)}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="section-number">02</p>
              <h2>全国平均との差</h2>
            </div>
            <p>平均点が公開されている本試のみ</p>
          </div>
          <div className="card comparison-card">
            {mainRecords.map((record) => <ComparisonRow key={record.id} record={record} />)}
          </div>
        </section>

        <section id="breakdown" className="section-block">
          <div className="section-heading">
            <div>
              <p className="section-number">03</p>
              <h2>4試験の得点内訳</h2>
            </div>
            <p>合計・全国平均・大問別得点</p>
          </div>
          <div className="section-score-grid">
            {[...examRecords]
              .sort((a, b) => a.practicedAt.localeCompare(b.practicedAt))
              .map((record) => <ExamBreakdownCard key={record.id} record={record} />)}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="section-number">04</p>
              <h2>現在の分析</h2>
            </div>
          </div>
          <div className="insight-grid">
            <article className="insight primary-insight">
              <span className="insight-label">最も大きい変化</span>
              <strong>数学ⅠAが 44 → 73点</strong>
              <p>基本問題の回収力は上昇。第1問は追試で満点になりました。</p>
              <ArrowUpRightIcon />
            </article>
            <article className="insight">
              <span className="insight-label">残る共通課題</span>
              <strong>図形の性質</strong>
              <p>数学ⅠAでは2回続けて最重要弱点。単発のミスではなく継続課題です。</p>
            </article>
            <article className="insight">
              <span className="insight-label">安定している科目</span>
              <strong>数学ⅡBCは70点台を維持</strong>
              <p>本試70点、追試77点。基本・標準問題の完成度は比較的高い状態です。</p>
            </article>
          </div>
        </section>

        <section className="section-block" aria-labelledby="records-title">
          <div className="section-heading">
            <div>
              <p className="section-number">05</p>
              <h2 id="records-title">4試験の記録</h2>
            </div>
          </div>
          <div className="records-table-wrap">
            <table>
              <thead>
                <tr><th>解いた順</th><th>試験</th><th>科目</th><th>実施日</th><th>合計得点</th><th>全国平均点</th><th>評価</th></tr>
              </thead>
              <tbody>
                {[...examRecords].sort((a, b) => a.practicedAt.localeCompare(b.practicedAt)).map((record, index) => (
                  <tr key={record.id}>
                    <td><span className="order-badge">{index + 1}</span></td>
                    <td>
                      <Link href={`/exams/${record.id}`} className="table-detail-link">{record.year} {record.type}</Link>
                    </td>
                    <td>{record.subject}</td>
                    <td>{formatPracticeDate(record.practicedAt)}</td>
                    <td><strong>{record.score}</strong> / {record.maxScore}</td>
                    <td>{record.nationalAverage === undefined ? "未確認" : record.nationalAverage.toFixed(2)}</td>
                    <td><span className={`evaluation ${record.evaluation === "良好" ? "good" : "needs-work"}`}>{record.evaluation}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer>
          <span>KYO-SU v0.5</span>
          <span>Data source: Notion「共通テスト数学分析」</span>
        </footer>
      </main>
    </div>
  );
}
