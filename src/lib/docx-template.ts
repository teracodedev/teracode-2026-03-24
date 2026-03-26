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

const KANJI_DIGITS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

function toKanjiNumber(n: number): string {
  if (n <= 0) return "";
  let result = "";
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  if (hundreds > 0) result += (hundreds === 1 ? "" : KANJI_DIGITS[hundreds]) + "百";
  if (tens > 0) result += (tens === 1 ? "" : KANJI_DIGITS[tens]) + "十";
  if (ones > 0) result += KANJI_DIGITS[ones];
  return result;
}

export function calcAgeAtDeath(
  birthDate: Date | null,
  deathDate: Date
): string {
  if (!birthDate) return "";
  let age = deathDate.getFullYear() - birthDate.getFullYear();
  const m = deathDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && deathDate.getDate() < birthDate.getDate())) age--;
  return toKanjiNumber(age) + "歳";
}

export function toFullWidthHiragana(s: string | null | undefined): string {
  if (!s) return "";
  return s
    // 半角カタカナ → 全角カタカナ
    .replace(/[\uFF61-\uFF9F]/g, (ch) => {
      const map: Record<string, string> = {
        "ｦ": "ヲ", "ｧ": "ァ", "ｨ": "ィ", "ｩ": "ゥ", "ｪ": "ェ", "ｫ": "ォ",
        "ｬ": "ャ", "ｭ": "ュ", "ｮ": "ョ", "ｯ": "ッ", "ｰ": "ー",
        "ｱ": "ア", "ｲ": "イ", "ｳ": "ウ", "ｴ": "エ", "ｵ": "オ",
        "ｶ": "カ", "ｷ": "キ", "ｸ": "ク", "ｹ": "ケ", "ｺ": "コ",
        "ｻ": "サ", "ｼ": "シ", "ｽ": "ス", "ｾ": "セ", "ｿ": "ソ",
        "ﾀ": "タ", "ﾁ": "チ", "ﾂ": "ツ", "ﾃ": "テ", "ﾄ": "ト",
        "ﾅ": "ナ", "ﾆ": "ニ", "ﾇ": "ヌ", "ﾈ": "ネ", "ﾉ": "ノ",
        "ﾊ": "ハ", "ﾋ": "ヒ", "ﾌ": "フ", "ﾍ": "ヘ", "ﾎ": "ホ",
        "ﾏ": "マ", "ﾐ": "ミ", "ﾑ": "ム", "ﾒ": "メ", "ﾓ": "モ",
        "ﾔ": "ヤ", "ﾕ": "ユ", "ﾖ": "ヨ",
        "ﾗ": "ラ", "ﾘ": "リ", "ﾙ": "ル", "ﾚ": "レ", "ﾛ": "ロ",
        "ﾜ": "ワ", "ﾝ": "ン", "ﾞ": "゛", "ﾟ": "゜",
      };
      return map[ch] ?? ch;
    })
    // 濁点・半濁点の結合
    .replace(/([ウカキクケコサシスセソタチツテトハヒフヘホ])゛/g, (_, b) => {
      const v: Record<string, string> = {
        "ウ": "ヴ", "カ": "ガ", "キ": "ギ", "ク": "グ", "ケ": "ゲ", "コ": "ゴ",
        "サ": "ザ", "シ": "ジ", "ス": "ズ", "セ": "ゼ", "ソ": "ゾ",
        "タ": "ダ", "チ": "ヂ", "ツ": "ヅ", "テ": "デ", "ト": "ド",
        "ハ": "バ", "ヒ": "ビ", "フ": "ブ", "ヘ": "ベ", "ホ": "ボ",
      };
      return v[b] ?? b + "゛";
    })
    .replace(/([ハヒフヘホ])゜/g, (_, b) => {
      const p: Record<string, string> = { "ハ": "パ", "ヒ": "ピ", "フ": "プ", "ヘ": "ペ", "ホ": "ポ" };
      return p[b] ?? b + "゜";
    })
    // 全角カタカナ → ひらがな
    .replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .trim();
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

/** 年回法名用ラベル：四十九日忌 → 一周忌 → 三回忌 … の順 */
export function getNenkaiLabel(deathDate: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shijukuNichi = addDays(deathDate, 48);
  shijukuNichi.setHours(0, 0, 0, 0);
  if (shijukuNichi >= today) return "四十九日忌";

  for (const { key, years } of NENKAI_SCHEDULE) {
    const d = addYears(deathDate, years);
    d.setHours(0, 0, 0, 0);
    if (d >= today) return key;
  }
  return "五十回忌";
}
