import * as yaml from "js-yaml";

/**
 * フリガナを全角カタカナに変換する。
 * ひらがな → カタカナ、半角カタカナ → 全角カタカナ に変換する。
 */
export function toFullWidthKatakana(s: string | null | undefined): string | null {
  if (!s) return null;
  const result = s
    // 半角カタカナ → 全角カタカナ（濁点・半濁点の結合も処理）
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
        "｡": "。", "｢": "「", "｣": "」", "､": "、", "･": "・",
      };
      return map[ch] ?? ch;
    })
    // 濁点・半濁点の結合を合成（例: カﾞ → ガ）
    .replace(/([ウカキクケコサシスセソタチツテトハヒフヘホ])゛/g, (_, base) => {
      const voiced: Record<string, string> = {
        "ウ": "ヴ", "カ": "ガ", "キ": "ギ", "ク": "グ", "ケ": "ゲ", "コ": "ゴ",
        "サ": "ザ", "シ": "ジ", "ス": "ズ", "セ": "ゼ", "ソ": "ゾ",
        "タ": "ダ", "チ": "ヂ", "ツ": "ヅ", "テ": "デ", "ト": "ド",
        "ハ": "バ", "ヒ": "ビ", "フ": "ブ", "ヘ": "ベ", "ホ": "ボ",
      };
      return voiced[base] ?? base + "゛";
    })
    .replace(/([ハヒフヘホ])゜/g, (_, base) => {
      const semiVoiced: Record<string, string> = {
        "ハ": "パ", "ヒ": "ピ", "フ": "プ", "ヘ": "ペ", "ホ": "ポ",
      };
      return semiVoiced[base] ?? base + "゜";
    })
    // ひらがな → カタカナ
    .replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
  return result.trim() || null;
}

const NULL_DATE = "0001-01-01";
const UNKNOWN_AGE = 999;

function toYamlDate(d: Date | string | null | undefined): string {
  if (!d) return NULL_DATE;
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().split("T")[0];
}

function calcAge(birth: Date | null, death: Date | null): number {
  if (!birth || !death) return UNKNOWN_AGE;
  return death.getFullYear() - birth.getFullYear();
}

function combineAddress(a1?: string | null, a2?: string | null, a3?: string | null): string | null {
  const parts = [a1, a2, a3].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

export interface YamlPerson {
  個人UUID: string;
  姓: string;
  名: string | null;
  姓フリガナ: string | null;
  名フリガナ: string | null;
  性別: string;
  生年月日: string;
  命日: string;
  享年: number;
  "戒名・法名・法号": string | null;
  "戒名・法名・法号フリガナ": string | null;
  戸主: string;
  戸主UUID: string;
  続柄: string | null;
  備考: string | null;
  本籍: string | null;
  メールアドレス: string | null;
  分類: string;
  郵便番号: string | null;
  住所: string | null;
  電話番号1: string | null;
  電話番号2: string | null;
  FAX: string | null;
}

/** 戸主自身を YamlPerson に変換 */
export function householderToYaml(h: {
  id: string;
  familyName: string;
  givenName: string;
  familyNameKana?: string | null;
  givenNameKana?: string | null;
  gender?: string | null;
  birthDate?: Date | string | null;
  deathDate?: Date | string | null;
  dharmaName?: string | null;
  dharmaNameKana?: string | null;
  note?: string | null;
  domicile?: string | null;
  email?: string | null;
  postalCode?: string | null;
  address1?: string | null;
  address2?: string | null;
  address3?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  fax?: string | null;
}): YamlPerson {
  const birth = h.birthDate ? new Date(h.birthDate) : null;
  const death = h.deathDate ? new Date(h.deathDate) : null;
  return {
    個人UUID: h.id,
    姓: h.familyName,
    名: h.givenName || null,
    姓フリガナ: h.familyNameKana || null,
    名フリガナ: h.givenNameKana || null,
    性別: h.gender || "U",
    生年月日: toYamlDate(birth),
    命日: toYamlDate(death),
    享年: calcAge(birth, death),
    "戒名・法名・法号": h.dharmaName || null,
    "戒名・法名・法号フリガナ": h.dharmaNameKana || null,
    戸主: `${h.familyName}${h.givenName || ""}`,
    戸主UUID: h.id,
    続柄: null,
    備考: h.note || null,
    本籍: h.domicile || null,
    メールアドレス: h.email || null,
    分類: "戸主",
    郵便番号: h.postalCode || null,
    住所: combineAddress(h.address1, h.address2, h.address3),
    電話番号1: h.phone1 || null,
    電話番号2: h.phone2 || null,
    FAX: h.fax || null,
  };
}

/** 世帯員を YamlPerson に変換 */
export function memberToYaml(
  m: {
    id: string;
    familyName: string;
    givenName?: string | null;
    familyNameKana?: string | null;
    givenNameKana?: string | null;
    gender?: string | null;
    birthDate?: Date | string | null;
    deathDate?: Date | string | null;
    dharmaName?: string | null;
    dharmaNameKana?: string | null;
    relation?: string | null;
    note?: string | null;
    domicile?: string | null;
    email?: string | null;
    postalCode?: string | null;
    address1?: string | null;
    address2?: string | null;
    address3?: string | null;
    phone1?: string | null;
    phone2?: string | null;
    fax?: string | null;
  },
  householder: { id: string; familyName: string; givenName: string }
): YamlPerson {
  const birth = m.birthDate ? new Date(m.birthDate) : null;
  const death = m.deathDate ? new Date(m.deathDate) : null;
  return {
    個人UUID: m.id,
    姓: m.familyName,
    名: m.givenName || null,
    姓フリガナ: m.familyNameKana || null,
    名フリガナ: m.givenNameKana || null,
    性別: m.gender || "U",
    生年月日: toYamlDate(birth),
    命日: toYamlDate(death),
    享年: calcAge(birth, death),
    "戒名・法名・法号": m.dharmaName || null,
    "戒名・法名・法号フリガナ": m.dharmaNameKana || null,
    戸主: `${householder.familyName}${householder.givenName}`,
    戸主UUID: householder.id,
    続柄: m.relation || null,
    備考: m.note || null,
    本籍: m.domicile || null,
    メールアドレス: m.email || null,
    分類: death ? "故人" : "世帯員",
    郵便番号: m.postalCode || null,
    住所: combineAddress(m.address1, m.address2, m.address3),
    電話番号1: m.phone1 || null,
    電話番号2: m.phone2 || null,
    FAX: m.fax || null,
  };
}

/** YamlPerson オブジェクト → YAML 文字列 */
export function serializeYaml(person: YamlPerson): string {
  const dumpOptions: yaml.DumpOptions & { allowUnicode?: boolean } = {
    allowUnicode: true,
    lineWidth: -1,
    noRefs: true,
  };
  return yaml.dump({ 個人: person }, dumpOptions);
}

/** YAML 文字列 → YamlPerson オブジェクト */
export function parseYaml(content: string): YamlPerson {
  const doc = yaml.load(content) as { 個人?: YamlPerson };
  if (!doc?.個人) throw new Error("有効な個人データが見つかりません");
  return doc.個人;
}

/** YYYY-MM-DD 文字列を Date | null に変換（0001-01-01 は null） */
export function yamlDateToDate(s: string | null | undefined): Date | null {
  if (!s || s === NULL_DATE) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
