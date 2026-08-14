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

async function loadPages() {
  const databaseId = databaseIdFromUrl(requireEnv("NOTION_DATABASE_URL"));
  const database = await notionRequest(`/databases/${databaseId}`);
  const dataSourceId = database.data_sources?.[0]?.id;
  if (!dataSourceId) throw new Error("No data source was found in the configured Notion database.");

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

async function main() {
  const pages = await loadPages();
  const records = pages.map(normalizePage).sort((a, b) => a.practicedAt.localeCompare(b.practicedAt));
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

  const source = `// Generated from Notion by scripts/sync-notion.mjs. Do not edit directly.\nexport const examRecordsData = ${JSON.stringify(records, null, 2)} as const;\n`;
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, source, "utf8");
  console.log(`Synced and validated ${records.length} exam records from Notion.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
