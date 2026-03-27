import { NextRequest, NextResponse } from "next/server";
import { getHouseholderFieldMap, getHouseholderModelKind, getMemberDelegate } from "@/lib/prisma-models";
import { requireAuth } from "@/lib/require-auth";
import { matchesNormalizedSearch } from "@/lib/search-normalize";

export const runtime = "nodejs";

// 過去帳一覧取得（命日が設定されている世帯員）
export async function GET(request: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  try {
    const kind = getHouseholderModelKind();
    const memberDelegate = getMemberDelegate() as {
      findMany: (args: unknown) => Promise<unknown>;
    };
    const fields = getHouseholderFieldMap(kind);
    const relationName = fields.relation;

    const records = await memberDelegate.findMany({
      where: {
        deathDate: { not: null },
      },
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
      orderBy: { deathDate: "desc" },
    });

    const filtered = (records as Array<Record<string, unknown>>).filter((record) => {
      const householder = record[relationName] as Record<string, unknown> | null | undefined;
      return matchesNormalizedSearch(query, [
        String(record.familyName ?? ""),
        String(record.givenName ?? ""),
        `${String(record.familyName ?? "")} ${String(record.givenName ?? "")}`,
        `${String(record.familyName ?? "")}${String(record.givenName ?? "")}`,
        String(record.familyNameKana ?? ""),
        String(record.givenNameKana ?? ""),
        `${String(record.familyNameKana ?? "")} ${String(record.givenNameKana ?? "")}`,
        `${String(record.familyNameKana ?? "")}${String(record.givenNameKana ?? "")}`,
        String(record.dharmaName ?? ""),
        String(record.dharmaNameKana ?? ""),
        String(householder?.familyName ?? ""),
        String(householder?.givenName ?? ""),
        `${String(householder?.familyName ?? "")} ${String(householder?.givenName ?? "")}`,
        `${String(householder?.familyName ?? "")}${String(householder?.givenName ?? "")}`,
        String(householder?.[fields.code] ?? ""),
      ]);
    });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("GET /api/kakocho error:", error);
    return NextResponse.json({ error: (error as Error).message || "エラーが発生しました" }, { status: 500 });
  }
}
