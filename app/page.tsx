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
  const difference = previousDifference(subject);

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
        {difference === undefined
          ? <span>初回記録</span>
          : <span className={difference >= 0 ? "positive" : "negative"}>前回比 {difference >= 0 ? "+" : ""}{difference}</span>}
      </div>
    </article>
  );
}

function TrendChart({ subject }: { subject: Subject }) {
  const records = recordsBySubject(subject);
  const colorClass = subject === "数学ⅠA" ? "trend-ia" : "trend-iibc";
  const first = records[0];
  const latest = records.at(-1)!;
  const delta = latest.score - first.score;
  const y = (score: number) => 102 - score;
  const x = (index: number) => records.length === 1 ? 210 : 62 + (300 * index) / (records.length - 1);
  const points = records.map((record, index) => `${x(index)},${y(record.score)}`).join(" ");

  return (
    <article className="trend-card">
      <div className="trend-heading">
        <div>
          <p className="trend-subject">{subject}</p>
          <p className="muted">科目内演習順</p>
        </div>
        <div className="trend-result">
          <p className="trend-score">
            {first.score} <span>→</span> {latest.score}
          </p>
          <span className={`trend-delta ${delta >= 0 ? "positive-delta" : "negative-delta"}`}>
            {delta >= 0 ? "+" : ""}{delta}点
          </span>
        </div>
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
        <polyline points={points} className="score-path" />
        {records.map((record, index) => (
          <g key={record.id}>
            <circle cx={x(index)} cy={y(record.score)} r="6" className="score-point" />
            <text x={x(index)} y={y(record.score) - 12} textAnchor="middle">{record.score}</text>
          </g>
        ))}
      </svg>
      <div className="chart-labels" style={{ gridTemplateColumns: `repeat(${records.length}, minmax(58px, 1fr))` }}>
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
      <span className={`difference difference-badge ${difference >= 0 ? "positive-difference" : "negative-difference"}`}>
        <small>平均との差</small>
        {difference >= 0 ? "+" : ""}{difference.toFixed(2)}点
      </span>
    </div>
  );
}

function SectionComparisonCard({ subject }: { subject: Subject }) {
  const records = recordsBySubject(subject).slice(-2);
  const sectionNumbers = [...new Set(records.flatMap((record) => record.sections.map((section) => section.section)))].sort((a, b) => a - b);

  return (
    <article className="card section-comparison-card">
      <div className="section-comparison-head">
        <div>
          <span className={`subject-dot ${subject === "数学ⅠA" ? "ia" : "iibc"}`} />
          <h3>{subject}</h3>
        </div>
        <div className="comparison-legend" aria-label="凡例">
          {records.map((record, index) => (
            <span key={record.id}><i className={index === 0 ? "first-attempt" : "latest-attempt"} />{record.attemptOrder}回目</span>
          ))}
        </div>
      </div>
      <div className="section-comparison-rows">
        {sectionNumbers.map((sectionNumber) => (
          <div className="section-comparison-row" key={sectionNumber}>
            <strong>第{sectionNumber}問</strong>
            <div className="attempt-bars">
              {records.map((record, index) => {
                const section = record.sections.find((item) => item.section === sectionNumber);
                if (!section) return null;
                const rate = Math.round((section.score / section.maxScore) * 100);
                return (
                  <div className="attempt-bar-line" key={record.id}>
                    <span>{record.attemptOrder}回</span>
                    <div className="bar-track">
                      <div
                        className={`bar ${index === 0 ? "first-attempt" : "latest-attempt"}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <strong>{section.score}/{section.maxScore}</strong>
                    <small>{rate}%</small>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function WeaknessTimeline() {
  const records = [...examRecords].sort((a, b) => a.practicedAt.localeCompare(b.practicedAt));
  const counts = new Map<string, number>();
  for (const record of records) {
    counts.set(record.primaryWeakness, (counts.get(record.primaryWeakness) ?? 0) + 1);
  }
  const repeated = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  return (
    <article className="card weakness-timeline-card">
      <div className="analysis-card-head">
        <div>
          <span className="insight-label">WEAKNESS HISTORY</span>
          <h3>最重要弱点の推移</h3>
        </div>
        <span className="analysis-count">{records.length}回分</span>
      </div>
      {repeated.length > 0 && (
        <div className="repeat-summary">
          <span>繰り返している弱点</span>
          <strong>{repeated.map(([name, count]) => `${name}（${count}回）`).join("・")}</strong>
        </div>
      )}
      <div className="weakness-timeline">
        {records.map((record, index) => (
          <div className="weakness-timeline-row" key={record.id}>
            <div className="timeline-marker">
              <span>{index + 1}</span>
            </div>
            <div>
              <p>{formatPracticeDate(record.practicedAt)} · {record.subject} · {record.type}</p>
              <strong>{record.primaryWeakness}</strong>
            </div>
            {(counts.get(record.primaryWeakness) ?? 0) > 1 && (
              <span className="repeat-badge">{counts.get(record.primaryWeakness)}回</span>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}

function SectionDeltaCard({ subject }: { subject: Subject }) {
  const records = recordsBySubject(subject).slice(-2);
  if (records.length < 2) {
    return (
      <article className="card delta-card">
        <div className="analysis-card-head"><h3>{subject}</h3></div>
        <p className="empty-analysis">2回目の記録から、大問別の改善・悪化を表示します。</p>
      </article>
    );
  }

  const [previous, latest] = records;
  const deltas = latest.sections
    .map((section) => {
      const oldSection = previous.sections.find((item) => item.section === section.section);
      if (!oldSection) return null;
      const previousRate = Math.round((oldSection.score / oldSection.maxScore) * 100);
      const latestRate = Math.round((section.score / section.maxScore) * 100);
      return {
        section: section.section,
        previousRate,
        latestRate,
        delta: latestRate - previousRate,
      };
    })
    .filter((item): item is { section: number; previousRate: number; latestRate: number; delta: number } => item !== null);

  if (deltas.length === 0) {
    return (
      <article className="card delta-card">
        <div className="analysis-card-head"><h3>{subject}</h3></div>
        <p className="empty-analysis">直近2回で共通する大問がないため、比較できません。</p>
      </article>
    );
  }

  const largestGain = [...deltas].sort((a, b) => b.delta - a.delta)[0];
  const largestDrop = [...deltas].sort((a, b) => a.delta - b.delta)[0];

  return (
    <article className="card delta-card">
      <div className="analysis-card-head">
        <div>
          <span className="insight-label">SECTION CHANGE</span>
          <h3>{subject}</h3>
        </div>
        <span className="analysis-count">{previous.attemptOrder}回目 → {latest.attemptOrder}回目</span>
      </div>
      <div className="delta-highlights">
        <div className="gain">
          <span>最大の改善</span>
          <strong>第{largestGain.section}問</strong>
          <small>+{largestGain.delta}ポイント</small>
        </div>
        <div className={largestDrop.delta < 0 ? "drop" : "steady"}>
          <span>{largestDrop.delta < 0 ? "最大の低下" : "全大問で改善"}</span>
          <strong>第{largestDrop.section}問</strong>
          <small>{largestDrop.delta >= 0 ? "+" : ""}{largestDrop.delta}ポイント</small>
        </div>
      </div>
      <div className="delta-list">
        {deltas.map((item) => (
          <div className="delta-row" key={item.section}>
            <strong>第{item.section}問</strong>
            <span>{item.previousRate}% → {item.latestRate}%</span>
            <b className={item.delta > 0 ? "delta-up" : item.delta < 0 ? "delta-down" : "delta-flat"}>
              {item.delta >= 0 ? "+" : ""}{item.delta}
            </b>
          </div>
        ))}
      </div>
    </article>
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
      <Link href={`/records/${record.id}`} className="detail-link">
        詳細分析を見る <span>→</span>
      </Link>
    </article>
  );
}

export default function Home() {
  const latestDate = [...examRecords].sort((a, b) => b.practicedAt.localeCompare(a.practicedAt))[0].practicedAt;
  const average = examRecords.reduce((sum, record) => sum + record.score, 0) / examRecords.length;
  const mainRecords = examRecords.filter((record) => record.type === "本試");
  const iaRecords = recordsBySubject("数学ⅠA");
  const iibcRecords = recordsBySubject("数学ⅡBC");
  const iaChange = iaRecords.at(-1)!.score - iaRecords[0].score;
  const iibcPreviousChange = previousDifference("数学ⅡBC");
  const latestOverall = [...examRecords].sort((a, b) => b.practicedAt.localeCompare(a.practicedAt))[0];

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
          <a href="#section-comparison" className="nav-link"><span>≋</span>大問比較</a>
          <a href="#national" className="nav-link"><span>◇</span>全国比較</a>
          <a href="#weakness" className="nav-link"><span>◎</span>弱点分析</a>
        </nav>
        <div className="sidebar-note">
          <span className="status-dot" />
          <div>
            <strong>Notion同期版</strong>
            <p>Actionsから手動更新</p>
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
            <p>全{examRecords.length}試験・科目内演習順</p>
          </div>
          <div className="trend-grid">
            {subjects.map((subject) => <TrendChart key={subject} subject={subject} />)}
          </div>
        </section>

        <section id="section-comparison" className="section-block">
          <div className="section-heading">
            <div>
              <p className="section-number">02</p>
              <h2>大問別得点率の変化</h2>
            </div>
            <p>同じ科目の本試・追試を比較</p>
          </div>
          <div className="section-comparison-grid">
            {subjects.map((subject) => <SectionComparisonCard key={subject} subject={subject} />)}
          </div>
        </section>

        <section id="national" className="section-block">
          <div className="section-heading">
            <div>
              <p className="section-number">03</p>
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
              <p className="section-number">04</p>
              <h2>{examRecords.length}試験の得点内訳</h2>
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
              <p className="section-number">05</p>
              <h2>現在の分析</h2>
            </div>
          </div>
          <div className="insight-grid">
            <article className="insight primary-insight">
              <span className="insight-label">最も大きい変化</span>
              <strong>数学ⅠAが {iaRecords[0].score} → {iaRecords.at(-1)!.score}点</strong>
              <p>初回から{iaChange >= 0 ? "+" : ""}{iaChange}点。基本問題の回収力は上昇し、第1問は追試で満点になりました。</p>
              <ArrowUpRightIcon />
            </article>
            <article className="insight">
              <span className="insight-label">最新の重点課題</span>
              <strong>{latestOverall.primaryWeakness}</strong>
              <p>{latestOverall.name}の分析から取得した、現在の最重要弱点です。</p>
            </article>
            <article className="insight">
              <span className="insight-label">数学ⅡBCの最新状況</span>
              <strong>最新 {iibcRecords.at(-1)!.score}点</strong>
              <p>{iibcPreviousChange === undefined ? "初回記録です。" : `前回から${iibcPreviousChange >= 0 ? "+" : ""}${iibcPreviousChange}点。`}最新の推移を自動表示しています。</p>
            </article>
          </div>
        </section>

        <section id="weakness" className="section-block">
          <div className="section-heading">
            <div>
              <p className="section-number">06</p>
              <h2>弱点と大問の変化</h2>
            </div>
            <p>Notionの記録から自動分析</p>
          </div>
          <div className="weakness-analysis-layout">
            <WeaknessTimeline />
            <div className="delta-card-grid">
              {subjects.map((subject) => <SectionDeltaCard key={subject} subject={subject} />)}
            </div>
          </div>
        </section>

        <section className="section-block" aria-labelledby="records-title">
          <div className="section-heading">
            <div>
              <p className="section-number">07</p>
              <h2 id="records-title">{examRecords.length}試験の記録</h2>
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
                      <Link href={`/records/${record.id}`} className="table-detail-link">{record.year} {record.type}</Link>
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
          <span>KYO-SU v0.8</span>
          <span>Data source: Notion「共通テスト数学分析」</span>
        </footer>
      </main>
    </div>
  );
}
