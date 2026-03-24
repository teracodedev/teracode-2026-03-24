import { NextRequest, NextResponse } from "next/server";
import { getMemberDelegate } from "@/lib/prisma-models";
import { requireAuth } from "@/lib/require-auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; memberId: string }> };

// 世帯員更新
export async function PUT(request: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { memberId } = await params;

  try {
    const memberDelegate = getMemberDelegate() as {
      update: (args: unknown) => Promise<unknown>;
    };
    const body = await request.json();
    const { familyName, givenName, familyNameKana, givenNameKana, relation,
            postalCode, address1, address2, address3, phone1, phone2, fax, domicile,
            birthDate, deathDate, dharmaName, dharmaNameKana, note } = body;

    if (!familyName) {
      return NextResponse.json({ error: "姓は必須です" }, { status: 400 });
    }

    const member = await memberDelegate.update({
      where: { id: memberId },
      data: {
        familyName,
        givenName: givenName || null,
        familyNameKana: familyNameKana || null,
        givenNameKana: givenNameKana || null,
        relation: relation || null,
        postalCode: postalCode || null,
        address1: address1 || null,
        address2: address2 || null,
        address3: address3 || null,
        phone1: phone1 || null,
        phone2: phone2 || null,
        fax: fax || null,
        domicile: domicile || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        deathDate: deathDate ? new Date(deathDate) : null,
        dharmaName: dharmaName || null,
        dharmaNameKana: dharmaNameKana || null,
        note: note || null,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error(`PUT /api/householder/members/${memberId} error:`, error);
    return NextResponse.json({ error: (error as Error).message || "更新に失敗しました" }, { status: 500 });
  }
}

// 世帯員削除
export async function DELETE(_request: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { memberId } = await params;

  try {
    const memberDelegate = getMemberDelegate() as {
      delete: (args: unknown) => Promise<unknown>;
    };
    await memberDelegate.delete({ where: { id: memberId } });
    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error(`DELETE /api/householder/members/${memberId} error:`, error);
    return NextResponse.json({ error: (error as Error).message || "削除に失敗しました" }, { status: 500 });
  }
}
