import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import MDBReader from "mdb-reader";

export const runtime = "nodejs";

// 氏名を姓と名に分割（全角スペースまたは半角スペースで区切る）
function splitName(fullName: unknown): [string, string] {
  if (!fullName || typeof fullName !== "string") return ["", ""];
  const trimmed = fullName.trim();
  const idx = trimmed.search(/[\u3000 \u0020]/);
  if (idx >= 0) {
    return [trimmed.slice(0, idx).trim(), trimmed.slice(idx + 1).trim()];
  }
  return [trimmed, ""];
}

// 性別変換（"男"→"M", "女"→"F"）
function toGender(g: unknown): string | null {
  if (g === "男") return "M";
  if (g === "女") return "F";
  return null;
}

// 日付変換
function toDate(d: unknown): Date | null {
  if (!d) return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  const dt = new Date(d as string);
  return isNaN(dt.getTime()) ? null : dt;
}

// null/空文字列を null に変換
function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export async function POST(req: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let reader: MDBReader;
  try {
    reader = new MDBReader(buffer);
  } catch {
    return NextResponse.json({ error: "MDBファイルの読み込みに失敗しました" }, { status: 400 });
  }

  // テーブル名を確認
  const tableNames = reader.getTableNames();
  const hasHouseholder = tableNames.includes("UTB001_戸主");
  const hasFamily = tableNames.includes("UTB002_家族");
  if (!hasHouseholder) {
    return NextResponse.json({ error: "UTB001_戸主 テーブルが見つかりません。対応していないMDBファイルです。" }, { status: 400 });
  }

  // 戸主テーブルを読み込む
  const householderRows = reader.getTable("UTB001_戸主").getData();
  // 家族テーブルを読み込む（存在する場合）
  const familyRows = hasFamily ? reader.getTable("UTB002_家族").getData() : [];
  // 家族住所テーブルを読み込む（存在する場合）
  const hasAddress = tableNames.includes("UTB003_家族住所");
  const addressRows = hasAddress ? reader.getTable("UTB003_家族住所").getData() : [];

  // 家族住所を家族IDでインデックス化（家族ID → 住所行）
  const addressByFamilyId = new Map<number, Record<string, unknown>>();
  for (const addr of addressRows) {
    const fid = addr["家族ID"] as number;
    if (fid && !addressByFamilyId.has(fid)) {
      addressByFamilyId.set(fid, addr);
    }
  }

  // 台帳ID（MDB整数） → 新しい Householder UUID のマップ
  const idMap = new Map<number, string>();

  let householderCount = 0;
  let memberCount = 0;
  const errorList: string[] = [];

  // ───── 戸主をインポート ─────
  for (const row of householderRows) {
    try {
      const daichodId = row["台帳ID"] as number;
      const [familyName, givenName] = splitName(row["氏名"]);
      const [familyNameKana, givenNameKana] = splitName(row["ﾌﾘｶﾞﾅ"]);

      const householder = await prisma.householder.create({
        data: {
          familyName: familyName || "（不明）",
          givenName: givenName ?? "",
          familyNameKana: familyNameKana || null,
          givenNameKana: givenNameKana || null,
          postalCode: str(row["〒"]),
          address1: str(row["住所1"]),
          address2: str(row["住所2"]),
          address3: str(row["住所3"]),
          phone1: str(row["電話"]),
          phone2: str(row["携帯"]),
          fax: str(row["ＦＡＸ"]),
          email: str(row["Email"]),
          gender: toGender(row["性別"]),
          birthDate: toDate(row["生年月日"]),
          dharmaName: str(row["戒名"]),
          dharmaNameKana: str(row["戒名ｶﾅ"]),
          note: str(row["備考"]),
          domicile: str(row["本籍"]),
          joinedAt: toDate(row["新規登録日"]),
        },
      });

      // 家族・親族台帳を自動作成して紐付け
      const familyRegister = await prisma.familyRegister.create({
        data: { name: `${familyName}${givenName}の家族・親族台帳` },
      });
      await prisma.householder.update({
        where: { id: householder.id },
        data: { familyRegisterId: familyRegister.id },
      });

      idMap.set(daichodId, householder.id);
      householderCount++;
    } catch (e) {
      errorList.push(`戸主 台帳ID=${row["台帳ID"]}: ${(e as Error).message}`);
    }
  }

  // ───── 家族員をインポート ─────
  for (const row of familyRows) {
    try {
      const daichodId = row["台帳ID"] as number;
      const householderId = idMap.get(daichodId);
      if (!householderId) {
        errorList.push(`家族 台帳ID=${daichodId}: 対応する戸主が見つかりません（スキップ）`);
        continue;
      }

      const [familyName, givenName] = splitName(row["氏名"]);
      const [familyNameKana, givenNameKana] = splitName(row["ﾌﾘｶﾞﾅ"]);

      // UTB003_家族住所 から住所データを取得
      const familyId = row["家族ID"] as number;
      const addr = familyId ? addressByFamilyId.get(familyId) : undefined;

      await prisma.householderMember.create({
        data: {
          householderId,
          familyName: familyName || "（不明）",
          givenName: givenName || null,
          familyNameKana: familyNameKana || null,
          givenNameKana: givenNameKana || null,
          gender: toGender(row["性別"]),
          birthDate: toDate(row["生年月日"]),
          deathDate: toDate(row["命日"]),
          dharmaName: str(row["戒名"]),
          dharmaNameKana: str(row["戒名ｶﾅ"]),
          relation: str(row["続柄"]),
          note: str(row["個人備考"]),
          domicile: str(row["本籍"]),
          // UTB003_家族住所 のデータがあれば住所・電話を設定
          postalCode: addr ? str(addr["〒"]) : null,
          address1: addr ? str(addr["住所1"]) : null,
          address2: addr ? str(addr["住所2"]) : null,
          address3: addr ? str(addr["住所3"]) : null,
          phone1: addr ? str(addr["電話"]) : null,
          fax: addr ? str(addr["ＦＡＸ"]) : null,
          phone2: addr ? str(addr["携帯"]) : null,
        },
      });
      memberCount++;
    } catch (e) {
      errorList.push(`家族 台帳ID=${row["台帳ID"]} 行=${row["行番号"]}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({
    householders: householderCount,
    members: memberCount,
    errors: errorList.length,
    errorDetails: errorList.slice(0, 50), // 最大50件のエラー詳細を返す
  });
}
