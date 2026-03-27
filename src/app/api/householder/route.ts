import { NextRequest, NextResponse } from "next/server";
import { getHouseholderDelegate, getHouseholderFieldMap, getHouseholderModelKind } from "@/lib/prisma-models";
import { requireAuth } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { matchesNormalizedSearch } from "@/lib/search-normalize";

export const runtime = "nodejs";

// 戸主一覧取得
export async function GET(request: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const activeOnly = searchParams.get("active") !== "false";

  try {
    const kind = getHouseholderModelKind();
    const delegate = getHouseholderDelegate() as {
      findMany: (args: unknown) => Promise<unknown>;
    };
    const fields = getHouseholderFieldMap(kind);

    const include =
      kind === "householder"
        ? {
            members: true,
            familyRegister: { select: { id: true, name: true } },
          }
        : { members: true };

    const householderList = await delegate.findMany({
      where: {
        isActive: activeOnly ? true : undefined,
      },
      include,
      orderBy: [{ familyNameKana: "asc" }, { familyName: "asc" }],
    });

    const filtered = (householderList as Array<Record<string, unknown>>).filter((householder) =>
      matchesNormalizedSearch(query, [
        String(householder.familyName ?? ""),
        String(householder.givenName ?? ""),
        `${String(householder.familyName ?? "")} ${String(householder.givenName ?? "")}`,
        `${String(householder.familyName ?? "")}${String(householder.givenName ?? "")}`,
        String(householder.familyNameKana ?? ""),
        String(householder.givenNameKana ?? ""),
        `${String(householder.familyNameKana ?? "")} ${String(householder.givenNameKana ?? "")}`,
        `${String(householder.familyNameKana ?? "")}${String(householder.givenNameKana ?? "")}`,
        String(householder[fields.code] ?? ""),
        String(householder.address1 ?? ""),
        String(householder.address2 ?? ""),
        String(householder.address3 ?? ""),
      ])
    );

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("GET /api/householder error:", error);
    return NextResponse.json({ error: (error as Error).message || "エラーが発生しました" }, { status: 500 });
  }
}

// 戸主新規登録
export async function POST(request: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const kind = getHouseholderModelKind();
    const delegate = getHouseholderDelegate() as {
      create: (args: unknown) => Promise<unknown>;
    };
    const fields = getHouseholderFieldMap(kind);
    const body = await request.json();
    const {
      familyName,
      givenName,
      familyNameKana,
      givenNameKana,
      postalCode,
      address1,
      address2,
      address3,
      phone1,
      phone2,
      email,
      domicile,
      note,
      joinedAt,
      members,
    } = body;

    if (!familyName || !givenName) {
      return NextResponse.json(
        { error: "姓・名は必須です" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {
        familyName,
        givenName,
        familyNameKana: familyNameKana || null,
        givenNameKana: givenNameKana || null,
        postalCode: postalCode || null,
        address1: address1 || null,
        address2: address2 || null,
        address3: address3 || null,
        [fields.phoneMain]: phone1 || null,
        email: email || null,
        note: note || null,
        joinedAt: joinedAt ? new Date(joinedAt) : null,
        members: members?.length
          ? {
              create: members.map((m: {
                familyName: string;
                givenName?: string;
                familyNameKana?: string;
                givenNameKana?: string;
                relation?: string;
                birthDate?: string;
                dharmaName?: string;
                dharmaNameKana?: string;
                note?: string;
              }) => ({
                familyName: m.familyName,
                givenName: m.givenName || null,
                familyNameKana: m.familyNameKana || null,
                givenNameKana: m.givenNameKana || null,
                relation: m.relation || null,
                birthDate: m.birthDate ? new Date(m.birthDate) : null,
                dharmaName: m.dharmaName || null,
                dharmaNameKana: m.dharmaNameKana || null,
                note: m.note || null,
              })),
            }
          : undefined,
      };

    if (fields.phoneSub) {
      data[fields.phoneSub] = phone2 || null;
    }

    if (fields.domicile) {
      data[fields.domicile] = domicile || null;
    }

    // 家族・親族台帳を自動作成して紐付け
    const familyRegister = await prisma.familyRegister.create({
      data: { name: `${familyName}${givenName}の家族・親族台帳` },
    });
    data.familyRegisterId = familyRegister.id;

    const householder = await delegate.create({
      data,
      include: { members: true },
    });

    return NextResponse.json(householder, { status: 201 });
  } catch (error) {
    console.error("POST /api/householder error:", error);
    return NextResponse.json({ error: (error as Error).message || "エラーが発生しました" }, { status: 500 });
  }
}
