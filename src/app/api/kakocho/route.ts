import { NextRequest, NextResponse } from "next/server";
import { getHouseholderFieldMap, getHouseholderModelKind, getMemberDelegate } from "@/lib/prisma-models";
import { requireAuth } from "@/lib/require-auth";

export const runtime = "nodejs";

// 日本の元号定義
const ERA_START: Record<string, number> = {
  令和: 2019,
  平成: 1989,
  昭和: 1926,
  大正: 1912,
  明治: 1868,
};

function eraYearToGregorian(era: string, year: number): number | null {
  const base = ERA_START[era];
  if (!base) return null;
  return base + year - 1;
}

type SortMode = "nen" | "getsu" | "nichi" | "fusho" | "fumei";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sortRecords(records: any[], mode: SortMode, order: "asc" | "desc") {
  const sign = order === "asc" ? 1 : -1;

  if (mode === "getsu") {
    return records.sort((a, b) => {
      const da = a.deathDate ? new Date(a.deathDate) : null;
      const db = b.deathDate ? new Date(b.deathDate) : null;
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      const monthA = da.getMonth() * 31 + da.getDate();
      const monthB = db.getMonth() * 31 + db.getDate();
      return sign * (monthA - monthB);
    });
  }

  if (mode === "nichi") {
    return records.sort((a, b) => {
      const da = a.deathDate ? new Date(a.deathDate).getDate() : 0;
      const db = b.deathDate ? new Date(b.deathDate).getDate() : 0;
      return sign * (da - db);
    });
  }

  return records;
}

export async function GET(request: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const sp = request.nextUrl.searchParams;
  const query   = sp.get("q") || "";
  const sort    = (sp.get("sort") || "nen") as SortMode;
  const order   = (sp.get("order") || "asc") as "asc" | "desc";
  const era     = sp.get("era") || "";
  const yearStr = sp.get("year") || "";

  try {
    const kind = getHouseholderModelKind();
    const memberDelegate = getMemberDelegate() as {
      findMany: (args: unknown) => Promise<unknown>;
    };
    const fields = getHouseholderFieldMap(kind);
    const relationName = fields.relation;

    // 命日フィルタ
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseFilter: any = {};
    if (sort === "fusho") {
      baseFilter.isMeinichiFusho = true;
    } else {
      baseFilter.deathDate = { not: null };
    }

    // 年フィルタ（元号+年 → グレゴリオ暦）
    if (era && yearStr) {
      const gYear = eraYearToGregorian(era, parseInt(yearStr, 10));
      if (gYear) {
        baseFilter.deathDate = {
          gte: new Date(`${gYear}-01-01`),
          lte: new Date(`${gYear}-12-31`),
        };
      }
    }

    // 戸主不明フィルタ
    if (sort === "fumei") {
      baseFilter[relationName] = { givenName: null };
    }

    // 検索フィルタ
    if (query) {
      baseFilter.OR = [
        { familyName:     { contains: query, mode: "insensitive" } },
        { givenName:      { contains: query, mode: "insensitive" } },
        { familyNameKana: { contains: query, mode: "insensitive" } },
        { givenNameKana:  { contains: query, mode: "insensitive" } },
        { dharmaName:     { contains: query, mode: "insensitive" } },
        { dharmaNameKana: { contains: query, mode: "insensitive" } },
        { [relationName]: { familyName: { contains: query, mode: "insensitive" } } },
      ];
    }

    const records = (await memberDelegate.findMany({
      where: baseFilter,
      include: {
        [relationName]: {
          select: {
            id: true,
            [fields.code]: true,
            familyName: true,
            givenName: true,
            familyRegister: { select: { id: true, name: true } },
          },
        },
      },
      orderBy:
        sort === "nen" || sort === "fusho" || sort === "fumei"
          ? { deathDate: order }
          : { createdAt: "desc" },
    })) as unknown[];

    const sorted =
      sort === "getsu" || sort === "nichi"
        ? sortRecords(records as never[], sort, order)
        : records;

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("GET /api/kakocho error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "エラーが発生しました" },
      { status: 500 }
    );
  }
}
