import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const NOTION_VERSION = "2025-09-03";
const OUTPUT_PATH = resolve("lib/exams.generated.ts");

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function optionalEnv(name) {
  return process.env[name]?.trim() || undefined;
}

export function databaseIdFromUrl(value) {
  const compact = value.replaceAll("-", "");
  const match = compact.match(/([0-9a-f]{32})(?:[^0-9a-f]|$)/i);
  if (!match) throw new Error("NOTION_DATABASE_URL does not contain a valid Notion database ID.");
  return match[1].replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
}

async function notionRequest(path, init = {}) {
  const token = requireEnv("NOTION_TOKEN");
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion API ${response.status}: ${body.slice(0, 500)}`);
  }
  return response.json();
}

function plainText(items = []) {
  return items.map((item) => item.plain_text ?? item.text?.content ?? "").join("").trim();
}

function valueOf(property) {
  if (!property) return undefined;
  switch (property.type) {
    case "title": return plainText(property.title);
    case "rich_text": return plainText(property.rich_text);
    case "number": return property.number ?? undefined;
    case "select": return property.select?.name;
    case "status": return property.status?.name;
    case "date": return property.date?.start;
    case "relation": return property.relation?.map((item) => item.id) ?? [];
    default: return undefined;
  }
}

function recordId(year, type, subject) {
  const exam = type === "本試" ? "main" : type === "追試" ? "retest" : "other";
  const subjectCode = subject === "数学ⅠA" ? "1a" : subject === "数学ⅡBC" ? "2bc" : "unknown";
  return `${year}-${exam}-${subjectCode}`;
}

function required(value, label, rowName) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${rowName}: required property '${label}' is empty.`);
  }
  return value;
}

export function normalizePage(page) {
  const p = page.properties;
  const name = required(valueOf(p["記録名"]), "記録名", page.id);
  const year = Number(required(valueOf(p["年度"]), "年度", name));
  const type = required(valueOf(p["試験区分"]), "試験区分", name);
  const subject = required(valueOf(p["科目"]), "科目", name);
  const attemptOrder = Number(required(valueOf(p["科目内演習順"]), "科目内演習順", name));
  const practicedAt = required(valueOf(p["実施日"]), "実施日", name);
  const score = Number(required(valueOf(p["得点"]), "得点", name));
  const maxScore = Number(required(valueOf(p["満点"]), "満点", name));

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error(`${name}: 年度 must be an integer between 2000 and 2100.`);
  }
  if (!["本試", "追試"].includes(type)) {
    throw new Error(`${name}: 試験区分 must be 本試 or 追試.`);
  }
  if (!["数学ⅠA", "数学ⅡBC"].includes(subject)) {
    throw new Error(`${name}: 科目 must be 数学ⅠA or 数学ⅡBC.`);
  }
  if (!Number.isInteger(attemptOrder) || attemptOrder < 1) {
    throw new Error(`${name}: 科目内演習順 must be a positive integer.`);
  }
  if (typeof practicedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(practicedAt) || Number.isNaN(Date.parse(`${practicedAt}T00:00:00Z`))) {
    throw new Error(`${name}: 実施日 must be a valid YYYY-MM-DD date.`);
  }
  if (!Number.isFinite(maxScore) || maxScore <= 0 || !Number.isFinite(score) || score < 0 || score > maxScore) {
    throw new Error(`${name}: 得点 and 満点 are outside the valid range.`);
  }

  const id = recordId(year, type, subject);
  const sections = [];
  for (let section = 1; section <= 7; section += 1) {
    const sectionScore = valueOf(p[`第${section}問得点`]);
    const sectionMax = valueOf(p[`第${section}問満点`]);
    if (sectionScore === undefined && sectionMax === undefined) continue;
    if (sectionScore === undefined || sectionMax === undefined) {
      throw new Error(`${name}: section ${section} needs both score and max score.`);
    }
    const normalizedScore = Number(sectionScore);
    const normalizedMax = Number(sectionMax);
    if (!Number.isFinite(normalizedMax) || normalizedMax <= 0 || !Number.isFinite(normalizedScore) || normalizedScore < 0 || normalizedScore > normalizedMax) {
      throw new Error(`${name}: 第${section}問の得点または満点が不正です。`);
    }
    sections.push({ section, score: normalizedScore, maxScore: normalizedMax });
  }
  if (sections.length === 0) throw new Error(`${name}: no section scores were found.`);

  const sectionTotal = sections.reduce((sum, section) => sum + section.score, 0);
  const sectionMaxTotal = sections.reduce((sum, section) => sum + section.maxScore, 0);
  if (sectionTotal !== score) {
    throw new Error(`${name}: 大問別得点の合計${sectionTotal}点と総得点${score}点が一致しません。`);
  }
  if (sectionMaxTotal !== maxScore) {
    throw new Error(`${name}: 大問別満点の合計${sectionMaxTotal}点と満点${maxScore}点が一致しません。`);
  }
  const evaluation = valueOf(p["総合評価"]);
  if (evaluation !== undefined && !["非常に良好", "良好", "標準", "要改善", "重点改善"].includes(evaluation)) {
    throw new Error(`${name}: 総合評価が5段階の選択肢に一致しません。`);
  }
  const nationalAverage = valueOf(p["全国平均点"]);
  if (nationalAverage !== undefined && (!Number.isFinite(Number(nationalAverage)) || Number(nationalAverage) < 0 || Number(nationalAverage) > maxScore)) {
    throw new Error(`${name}: 全国平均点が有効範囲外です。`);
  }

  return {
    id,
    name,
    year,
    type,
    subject,
    attemptOrder,
    practicedAt,
    score,
    maxScore,
    ...(nationalAverage === undefined ? {} : { nationalAverage: Number(nationalAverage) }),
    ...(evaluation === undefined ? {} : { evaluation }),
    primaryWeakness: required(valueOf(p["最重要弱点"]), "最重要弱点", name),
    summary: required(valueOf(p["AI分析要約"]), "AI分析要約", name),
    sections,
  };
}

export function normalizeQuestionPage(page) {
  const p = page.properties;
  const name = required(valueOf(p["設問名"]), "設問名", page.id);
  const year = Number(required(valueOf(p["年度"]), "年度", name));
  const type = required(valueOf(p["試験区分"]), "試験区分", name);
  const subject = required(valueOf(p["科目"]), "科目", name);
  const attemptOrder = Number(required(valueOf(p["科目内演習順"]), "科目内演習順", name));
  const section = Number(required(valueOf(p["大問"]), "大問", name));
  const code = required(valueOf(p["設問コード"]), "設問コード", name);
  const points = Number(required(valueOf(p["配点"]), "配点", name));
  const result = required(valueOf(p["自分の結果"]), "自分の結果", name);
  const nationalCorrectRateValue = valueOf(p["全国正答率"]);
  const nationalCorrectRate = nationalCorrectRateValue === undefined
    ? undefined
    : Number(nationalCorrectRateValue);
  const field = required(valueOf(p["分野"]), "分野", name);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error(`${name}: 年度 must be an integer between 2000 and 2100.`);
  }
  if (!["本試", "追試"].includes(type)) {
    throw new Error(`${name}: 試験区分 must be 本試 or 追試.`);
  }
  if (!["数学ⅠA", "数学ⅡBC"].includes(subject)) {
    throw new Error(`${name}: 科目 must be 数学ⅠA or 数学ⅡBC.`);
  }
  if (!Number.isInteger(attemptOrder) || attemptOrder < 1) {
    throw new Error(`${name}: 科目内演習順 must be a positive integer.`);
  }
  if (!Number.isInteger(section) || section < 1 || section > 7) {
    throw new Error(`${name}: 大問 must be an integer between 1 and 7.`);
  }
  if (!Number.isFinite(points) || points <= 0) {
    throw new Error(`${name}: 配点 must be a positive number.`);
  }
  if (!["正解", "不正解"].includes(result)) {
    throw new Error(`${name}: 自分の結果 must be 正解 or 不正解.`);
  }
  if (nationalCorrectRate !== undefined && (!Number.isFinite(nationalCorrectRate) || nationalCorrectRate < 0 || nationalCorrectRate > 100)) {
    throw new Error(`${name}: 全国正答率 must be between 0 and 100.`);
  }

  return {
    id: page.id,
    examId: recordId(year, type, subject),
    name,
    year,
    type,
    subject,
    attemptOrder,
    section,
    code,
    points,
    result,
    ...(nationalCorrectRate === undefined ? {} : { nationalCorrectRate }),
    field,
    topic: valueOf(p["テーマ"]) ?? "",
    content: valueOf(p["問題内容"]) ?? "",
    priority: valueOf(p["復習優先度"]) ?? "通常",
    aiAnalysis: valueOf(p["AI分析"]) ?? "",
  };
}

export function normalizeAnalysisPage(page, recordIdByPageId) {
  const p = page.properties;
  const name = required(valueOf(p["分析項目名"]), "分析項目名", page.id);
  const relationIds = required(valueOf(p["演習記録"]), "演習記録", name);
  const publishedRelations = relationIds.filter((id) => recordIdByPageId.has(id));
  if (publishedRelations.length !== 1) {
    throw new Error(`${name}: 公開対象の演習記録Relationは1件だけ必要です。`);
  }
  const kind = required(valueOf(p["種別"]), "種別", name);
  const order = Number(required(valueOf(p["表示順"]), "表示順", name));
  const title = required(valueOf(p["タイトル"]), "タイトル", name);
  if (!["見出し", "失点帯", "指標", "観察", "優先失点", "強み", "弱点", "注記"].includes(kind)) {
    throw new Error(`${name}: 種別が未対応です。`);
  }
  if (!Number.isFinite(order) || order < 0) {
    throw new Error(`${name}: 表示順は0以上の数値にしてください。`);
  }
  const correctRateValue = valueOf(p["全国正答率"]);
  const correctRate = correctRateValue === undefined ? undefined : Number(correctRateValue);
  if (correctRate !== undefined && (!Number.isFinite(correctRate) || correctRate < 0 || correctRate > 100)) {
    throw new Error(`${name}: 全国正答率は0〜100で入力してください。`);
  }
  const pointsValue = valueOf(p["配点"]);
  const points = pointsValue === undefined ? undefined : Number(pointsValue);
  if (points !== undefined && (!Number.isFinite(points) || points < 0)) {
    throw new Error(`${name}: 配点は0以上にしてください。`);
  }
  return {
    id: page.id,
    examId: recordIdByPageId.get(publishedRelations[0]),
    name,
    kind,
    order,
    ...(valueOf(p["ラベル"]) ? { label: valueOf(p["ラベル"]) } : {}),
    title,
    ...(valueOf(p["本文"]) ? { detail: valueOf(p["本文"]) } : {}),
    ...(valueOf(p["表示値"]) ? { value: valueOf(p["表示値"]) } : {}),
    ...(valueOf(p["トーン"]) ? { tone: valueOf(p["トーン"]) } : {}),
    ...(valueOf(p["設問コード"]) ? { code: valueOf(p["設問コード"]) } : {}),
    ...(correctRate === undefined ? {} : { nationalCorrectRate: correctRate }),
    ...(points === undefined ? {} : { points }),
    ...(valueOf(p["優先度"]) ? { priority: valueOf(p["優先度"]) } : {}),
  };
}

async function queryAllPages(dataSourceId) {
  const pages = [];
  let startCursor;
  do {
    const body = await notionRequest(`/data_sources/${dataSourceId}/query`, {
      method: "POST",
      body: JSON.stringify({ page_size: 100, ...(startCursor ? { start_cursor: startCursor } : {}) }),
    });
    pages.push(...body.results);
    startCursor = body.has_more ? body.next_cursor : undefined;
  } while (startCursor);
  return pages;
}

async function questionDataSourceId(examDataSourceId) {
  const examDataSource = await notionRequest(`/data_sources/${examDataSourceId}`);
  const relation = examDataSource.properties?.["設問結果"]?.relation;
  const relatedId = relation?.data_source_id ?? relation?.database_id;
  if (relatedId) return relatedId;

  const configuredUrl = optionalEnv("NOTION_QUESTION_DATABASE_URL");
  if (configuredUrl) {
    const database = await notionRequest(`/databases/${databaseIdFromUrl(configuredUrl)}`);
    const configuredId = database.data_sources?.[0]?.id;
    if (configuredId) return configuredId;
  }

  throw new Error(
    "設問結果Relationから設問分析データソースを検出できません。KYO-SU連携へ設問分析のアクセス権を付与するか、NOTION_QUESTION_DATABASE_URLを設定してください。",
  );
}

async function analysisDataSourceId(examDataSourceId) {
  const examDataSource = await notionRequest(`/data_sources/${examDataSourceId}`);
  const relation = examDataSource.properties?.["分析項目"]?.relation;
  const relatedId = relation?.data_source_id ?? relation?.database_id;
  if (relatedId) return relatedId;

  const configuredUrl = optionalEnv("NOTION_ANALYSIS_DATABASE_URL");
  if (configuredUrl) {
    const database = await notionRequest(`/databases/${databaseIdFromUrl(configuredUrl)}`);
    const configuredId = database.data_sources?.[0]?.id;
    if (configuredId) return configuredId;
  }

  throw new Error(
    "分析項目Relationから分析項目データソースを検出できません。KYO-SU連携へ分析項目のアクセス権を付与するか、NOTION_ANALYSIS_DATABASE_URLを設定してください。",
  );
}

async function loadPages() {
  const databaseId = databaseIdFromUrl(requireEnv("NOTION_DATABASE_URL"));
  const database = await notionRequest(`/databases/${databaseId}`);
  const dataSourceId = database.data_sources?.[0]?.id;
  if (!dataSourceId) throw new Error("No data source was found in the configured Notion database.");

  const [relatedDataSourceId, analysisSourceId] = await Promise.all([
    questionDataSourceId(dataSourceId),
    analysisDataSourceId(dataSourceId),
  ]);
  const [examPages, questionPages, analysisPages] = await Promise.all([
    queryAllPages(dataSourceId),
    queryAllPages(relatedDataSourceId),
    queryAllPages(analysisSourceId),
  ]);
  return { examPages, questionPages, analysisPages };
}

async function main() {
  const { examPages, questionPages, analysisPages } = await loadPages();
  const publishedPages = examPages.filter((page) => valueOf(page.properties?.["公開状態"]) === "公開可");
  const normalizedRecords = publishedPages.map((page) => ({ pageId: page.id, record: normalizePage(page) }));
  const records = normalizedRecords.map(({ record }) => record).sort((a, b) => a.practicedAt.localeCompare(b.practicedAt));
  if (records.length === 0) throw new Error("No exam records were found. Deployment stopped.");
  if (new Set(records.map((record) => record.id)).size !== records.length) {
    throw new Error("Duplicate exam IDs were generated. Check 年度・試験区分・科目. Deployment stopped.");
  }
  for (const subject of ["数学ⅠA", "数学ⅡBC"]) {
    const subjectRecords = records.filter((record) => record.subject === subject);
    if (subjectRecords.length === 0) {
      throw new Error(`${subject}: at least one record is required. Deployment stopped.`);
    }
    const orders = subjectRecords.map((record) => record.attemptOrder);
    if (new Set(orders).size !== orders.length) {
      throw new Error(`${subject}: 科目内演習順 contains duplicates. Deployment stopped.`);
    }
  }

  const recordsById = new Map(records.map((record) => [record.id, record]));
  const questions = questionPages
    .map(normalizeQuestionPage)
    .filter((question) => recordsById.has(question.examId))
    .sort((a, b) => a.examId.localeCompare(b.examId) || a.section - b.section || a.code.localeCompare(b.code, "ja"));
  for (const question of questions) {
    const record = recordsById.get(question.examId);
    if (!record) {
      throw new Error(`${question.name}: 対応する演習記録 ${question.examId} が見つかりません。`);
    }
    if (record.attemptOrder !== question.attemptOrder) {
      throw new Error(`${question.name}: 科目内演習順が演習記録と一致しません。`);
    }
  }
  if (new Set(questions.map((question) => question.id)).size !== questions.length) {
    throw new Error("Duplicate question IDs were found. Deployment stopped.");
  }

  const recordIdByPageId = new Map(normalizedRecords.map(({ pageId, record }) => [pageId, record.id]));
  const analysisItems = analysisPages
    .filter((page) => (valueOf(page.properties?.["演習記録"]) ?? []).some((id) => recordIdByPageId.has(id)))
    .map((page) => normalizeAnalysisPage(page, recordIdByPageId))
    .sort((a, b) => a.examId.localeCompare(b.examId) || a.order - b.order);
  if (new Set(analysisItems.map((item) => item.id)).size !== analysisItems.length) {
    throw new Error("Duplicate analysis item IDs were found. Deployment stopped.");
  }
  for (const record of records) {
    const items = analysisItems.filter((item) => item.examId === record.id);
    if (items.filter((item) => item.kind === "見出し").length !== 1) {
      throw new Error(`${record.name}: 見出しは1件だけ必要です。`);
    }
    if (items.filter((item) => item.kind === "強み").length < 1) {
      throw new Error(`${record.name}: 強みが1件以上必要です。`);
    }
    if (items.filter((item) => item.kind === "弱点").length < 1) {
      throw new Error(`${record.name}: 弱点が1件以上必要です。`);
    }
  }

  const source = `// Generated from Notion by scripts/sync-notion.mjs. Do not edit directly.\nexport const examRecordsData = ${JSON.stringify(records, null, 2)} as const;\n\nexport const questionResultsData = ${JSON.stringify(questions, null, 2)} as const;\n\nexport const analysisItemsData = ${JSON.stringify(analysisItems, null, 2)} as const;\n`;
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, source, "utf8");
  console.log(`Synced and validated ${records.length} exam records, ${questions.length} question results, and ${analysisItems.length} analysis items from Notion.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
