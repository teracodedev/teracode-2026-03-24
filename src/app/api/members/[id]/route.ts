import { NextRequest, NextResponse } from "next/server";
import { getMemberDelegate, getHouseholderFieldMap, getHouseholderModelKind } from "@/lib/prisma-models";
import { requireAuth } from "@/lib/require-auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;

  try {
    const kind = getHouseholderModelKind();
    const memberDelegate = getMemberDelegate() as {
      findUnique: (args: unknown) => Promise<unknown>;
    };
    const fields = getHouseholderFieldMap(kind);
    const relationName = fields.relation;

    const member = await memberDelegate.findUnique({
      where: { id },
      include: {
        [relationName]: {
          include: {
            familyRegister: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error(`GET /api/members/${id} error:`, error);
    return NextResponse.json({ error: (error as Error).message || "エラーが発生しました" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;

  try {
    const memberDelegate = getMemberDelegate() as {
      update: (args: unknown) => Promise<unknown>;
    };
    const body = await request.json();
    const {
      familyName, givenName, familyNameKana, givenNameKana,
      relation, birthDate, deathDate,
      dharmaName, dharmaNameKana, note,
    } = body;

    if (!familyName) {
      return NextResponse.json({ error: "姓は必須です" }, { status: 400 });
    }

    const member = await memberDelegate.update({
      where: { id },
      data: {
        familyName,
        givenName: givenName || null,
        familyNameKana: familyNameKana || null,
        givenNameKana: givenNameKana || null,
        relation: relation || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        deathDate: deathDate ? new Date(deathDate) : null,
        dharmaName: dharmaName || null,
        dharmaNameKana: dharmaNameKana || null,
        note: note || null,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error(`PATCH /api/members/${id} error:`, error);
    return NextResponse.json({ error: (error as Error).message || "更新に失敗しました" }, { status: 500 });
  }
}
