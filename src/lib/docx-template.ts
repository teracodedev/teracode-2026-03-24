import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import nunjucks from "nunjucks";
import fs from "fs";

// nunjucks 環境（autoescape オフ：docxtemplater 側で XML エスケープを管理）
const njkEnv = new nunjucks.Environment(null, { autoescape: false });

/**
 * .docx テンプレートに変数を埋め込んで返す。
 *
 * テンプレート内の {{ 変数名 }} を nunjucks で評価する。
 * docxtemplater が XML の断片化（複数の <w:t> ノードへの分割）を自動処理し、
 * nunjucks がその式を評価する。
 */
export async function fillDocxTemplate(
  templatePath: string,
  vars: Record<string, string>
): Promise<Buffer> {
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // テンプレートの {{ }} を nunjucks と同じ記法で使用
    delimiters: { start: "{{", end: "}}" },
    // nunjucks をパーサーとして組み込む
    parser: (tag: string) => ({
      get: (scope: Record<string, string>) => {
        try {
          // {{ 変数名 }} をnunjucksで評価
          return njkEnv.renderString(`{{ ${tag} }}`, scope) ?? "";
        } catch {
          return "";
        }
      },
    }),
  });

  doc.render(vars);

  const buffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return Buffer.from(buffer);
}

// ── 日付ユーティリティ ────────────────────────────────────────────

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

// 中陰表（命日を1日目として数える）
export const CHUIN_SCHEDULE = [
  { key: "初七日忌", days: 6 },
  { key: "二七日忌", days: 13 },
  { key: "三七日忌", days: 20 },
  { key: "四七日忌", days: 27 },
  { key: "五七日忌", days: 34 },
  { key: "六七日忌", days: 41 },
  { key: "四十九日忌", days: 48 },
];

// 年回表
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

/** 直近の仏事ラベルを返す（中陰 → 年回の順） */
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
