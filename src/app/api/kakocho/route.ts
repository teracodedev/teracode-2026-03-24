import { NextRequest, NextResponse } from "next/server";
import { getHouseholderFieldMap, getHouseholderModelKind, getMemberDelegate } from "@/lib/prisma-models";
import { requireAuth } from "@/lib/require-auth";

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
    const codeFilter = {
      [relationName]: { [fields.code]: { contains: query, mode: "insensitive" } },
    };
    const familyNameFilter = {
      [relationName]: { familyName: { contains: query, mode: "insensitive" } },
    };

    const records = await memberDelegate.findMany({
      where: {
        deathDate: { not: null },
        OR: query
          ? [
              { familyName: { contains: query, mode: "insensitive" } },
              { givenName: { contains: query, mode: "insensitive" } },
              { familyNameKana: { contains: query, mode: "insensitive" } },
              { givenNameKana: { contains: query, mode: "insensitive" } },
              { dharmaName: { contains: query, mode: "insensitive" } },
              { dharmaNameKana: { contains: query, mode: "insensitive" } },
              familyNameFilter,
              codeFilter,
            ]
          : undefined,
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

    return NextResponse.json(records);
  } catch (error) {
    console.error("GET /api/kakocho error:", error);
    return NextResponse.json({ error: (error as Error).message || "エラーが発生しました" }, { status: 500 });
  }
}
