import JSZip from "jszip";
import fs from "fs";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Fill {{variable}} placeholders in a single paragraph element.
 * Handles cases where {{ ... }} is split across multiple <w:t> runs.
 */
function fillParagraph(para: string, vars: Record<string, string>): string {
  // Collect all <w:t> text nodes with their positions in the paragraph string
  const nodes: {
    open: string;
    text: string;
    close: string;
    index: number;
    fullLength: number;
  }[] = [];
  const regex = /(<w:t[^>]*>)([^<]*)(<\/w:t>)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(para)) !== null) {
    nodes.push({
      open: m[1],
      text: m[2],
      close: m[3],
      index: m.index,
      fullLength: m[0].length,
    });
  }

  if (nodes.length === 0) return para;

  // Concatenate all text content from this paragraph
  const fullText = nodes.map((n) => n.text).join("");

  // Check if any replacement is needed
  let hasChange = false;
  for (const k of Object.keys(vars)) {
    if (fullText.includes(`{{${k}}}`)) {
      hasChange = true;
      break;
    }
  }
  if (!hasChange) return para;

  // Build character position ranges for each node
  let pos = 0;
  const nodeRanges = nodes.map((node) => {
    const start = pos;
    pos += node.text.length;
    return { ...node, start, end: pos };
  });

  // Mark each character in fullText as normal / first-of-placeholder / skip
  const charStatus: ("normal" | "first" | "skip")[] = new Array(
    fullText.length
  ).fill("normal");
  const charReplace: string[] = new Array(fullText.length).fill("");

  for (const [k, v] of Object.entries(vars)) {
    const placeholder = `{{${k}}}`;
    let searchPos = 0;
    while (true) {
      const idx = fullText.indexOf(placeholder, searchPos);
      if (idx === -1) break;
      charStatus[idx] = "first";
      charReplace[idx] = escapeXml(v);
      for (let i = idx + 1; i < idx + placeholder.length; i++) {
        charStatus[i] = "skip";
      }
      searchPos = idx + placeholder.length;
    }
  }

  // Build new text content for each node
  const newNodeTexts = nodeRanges.map((node) => {
    let text = "";
    for (let i = node.start; i < node.end; i++) {
      if (charStatus[i] === "normal") text += fullText[i];
      else if (charStatus[i] === "first") text += charReplace[i];
      // 'skip' → omit
    }
    return text;
  });

  // Rebuild the paragraph XML with updated text nodes (process in reverse to preserve offsets)
  let result = para;
  for (let i = nodeRanges.length - 1; i >= 0; i--) {
    const node = nodeRanges[i];
    const newText = newNodeTexts[i];
    // Add xml:space="preserve" if text has leading/trailing spaces
    let open = node.open;
    if (
      newText !== newText.trim() &&
      newText.trim().length > 0 &&
      !open.includes("xml:space")
    ) {
      open = open.replace("<w:t", '<w:t xml:space="preserve"');
    }
    result =
      result.slice(0, node.index) +
      open +
      newText +
      node.close +
      result.slice(node.index + node.fullLength);
  }

  return result;
}

/**
 * Fill all {{variable}} placeholders in a document.xml string.
 * Processes each <w:p> paragraph independently to handle split-run placeholders.
 */
function fillXml(xml: string, vars: Record<string, string>): string {
  return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (para) =>
    fillParagraph(para, vars)
  );
}

/**
 * Fill a .docx template file with variable values.
 * Returns the filled document as a Buffer.
 */
export async function fillDocxTemplate(
  templatePath: string,
  vars: Record<string, string>
): Promise<Buffer> {
  const fileBuffer = fs.readFileSync(templatePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  const docEntry = zip.file("word/document.xml");
  if (!docEntry) throw new Error("word/document.xml not found in template");

  const docXml = await docEntry.async("string");
  const newDocXml = fillXml(docXml, vars);
  zip.file("word/document.xml", newDocXml);

  const data = await zip.generateAsync({ type: "nodebuffer" });
  return Buffer.from(data);
}

// ── Date utilities ──────────────────────────────────────────────────────────

function toKanji(n: number): string {
  if (n === 0) return "〇";
  const digits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const units = ["", "十", "百", "千"];
  let result = "";
  const str = String(n);
  const len = str.length;
  for (let i = 0; i < len; i++) {
    const d = parseInt(str[i]);
    const unit = units[len - 1 - i];
    if (d === 0) continue;
    if (d === 1 && unit !== "") result += unit;
    else result += digits[d] + unit;
  }
  return result;
}

export function toWareki(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const day = date.getDate();

  let eraName: string;
  let eraYear: number;

  if (y > 2019 || (y === 2019 && m >= 5)) {
    eraName = "令和";
    eraYear = y - 2018;
  } else if (
    y > 1989 ||
    (y === 1989 && m > 1) ||
    (y === 1989 && m === 1 && day >= 8)
  ) {
    eraName = "平成";
    eraYear = y - 1988;
  } else if (y > 1926 || (y === 1926 && m === 12 && day >= 25)) {
    eraName = "昭和";
    eraYear = y - 1925;
  } else if (y > 1912 || (y === 1912 && m >= 8)) {
    eraName = "大正";
    eraYear = y - 1911;
  } else {
    eraName = "明治";
    eraYear = y - 1867;
  }

  return `${eraName}${toKanji(eraYear)}年${toKanji(m)}月${toKanji(day)}日`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export function calcAgeAtDeath(
  birthDate: Date | null,
  deathDate: Date
): string {
  if (!birthDate) return "";
  let age = deathDate.getFullYear() - birthDate.getFullYear();
  const m = deathDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && deathDate.getDate() < birthDate.getDate())) age--;
  return String(age);
}

// 中陰表 dates (命日を1日目として数える)
export const CHUIN_SCHEDULE = [
  { key: "初七日忌", days: 6 },
  { key: "二七日忌", days: 13 },
  { key: "三七日忌", days: 20 },
  { key: "四七日忌", days: 27 },
  { key: "五七日忌", days: 34 },
  { key: "六七日忌", days: 41 },
  { key: "四十九日忌", days: 48 },
];

// 年回 dates
export const NENKAI_SCHEDULE = [
  { key: "一周忌", years: 1 },
  { key: "三回忌", years: 2 },
  { key: "七回忌", years: 6 },
  { key: "十三回忌", years: 12 },
  { key: "十七回忌", years: 16 },
  { key: "二十五回忌", years: 24 },
  { key: "三十三回忌", years: 32 },
  { key: "五十回忌", years: 49 },
];

/** Calculate the next upcoming memorial service label (中陰 or 年回) */
export function getNextMemorialLabel(deathDate: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const { key, days } of CHUIN_SCHEDULE) {
    const d = addDays(deathDate, days);
    d.setHours(0, 0, 0, 0);
    if (d >= today) return key;
  }
  for (const { key, years } of NENKAI_SCHEDULE) {
    const d = addYears(deathDate, years);
    d.setHours(0, 0, 0, 0);
    if (d >= today) return key;
  }
  return "五十回忌";
}
