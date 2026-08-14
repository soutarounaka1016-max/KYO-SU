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
  const evaluationSource = valueOf(p["総合評価"]);
  const evaluation = ["良好", "非常に良好"].includes(evaluationSource) ? "良好" : "要改善";
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
    evaluation,
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
  const nationalCorrectRate = Number(required(valueOf(p["全国正答率"]), "全国正答率", name));
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
  if (!Number.isFinite(nationalCorrectRate) || nationalCorrectRate < 0 || nationalCorrectRate > 100) {
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
    nationalCorrectRate,
    field,
    topic: valueOf(p["テーマ"]) ?? "",
    content: valueOf(p["問題内容"]) ?? "",
    priority: valueOf(p["復習優先度"]) ?? "通常",
    aiAnalysis: valueOf(p["AI分析"]) ?? "",
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

async function loadPages() {
  const databaseId = databaseIdFromUrl(requireEnv("NOTION_DATABASE_URL"));
  const database = await notionRequest(`/databases/${databaseId}`);
  const dataSourceId = database.data_sources?.[0]?.id;
  if (!dataSourceId) throw new Error("No data source was found in the configured Notion database.");

  const relatedDataSourceId = await questionDataSourceId(dataSourceId);
  const [examPages, questionPages] = await Promise.all([
    queryAllPages(dataSourceId),
    queryAllPages(relatedDataSourceId),
  ]);
  return { examPages, questionPages };
}

async function main() {
  const { examPages, questionPages } = await loadPages();
  const records = examPages.map(normalizePage).sort((a, b) => a.practicedAt.localeCompare(b.practicedAt));
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

  const questions = questionPages
    .map(normalizeQuestionPage)
    .sort((a, b) => a.examId.localeCompare(b.examId) || a.section - b.section || a.code.localeCompare(b.code, "ja"));
  const recordsById = new Map(records.map((record) => [record.id, record]));
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

  const source = `// Generated from Notion by scripts/sync-notion.mjs. Do not edit directly.\nexport const examRecordsData = ${JSON.stringify(records, null, 2)} as const;\n\nexport const questionResultsData = ${JSON.stringify(questions, null, 2)} as const;\n`;
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, source, "utf8");
  console.log(`Synced and validated ${records.length} exam records and ${questions.length} question results from Notion.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
