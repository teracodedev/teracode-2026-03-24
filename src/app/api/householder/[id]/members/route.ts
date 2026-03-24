import { NextRequest, NextResponse } from "next/server";
import { getHouseholderFieldMap, getHouseholderModelKind, getMemberDelegate } from "@/lib/prisma-models";
import { requireAuth } from "@/lib/require-auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// 世帯員追加
export async function POST(request: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;
  const householderId = id;

  try {
    const kind = getHouseholderModelKind();
    const fields = getHouseholderFieldMap(kind);
    const memberDelegate = getMemberDelegate() as {
      create: (args: unknown) => Promise<unknown>;
    };
    const body = await request.json();
    const { familyName, givenName, familyNameKana, givenNameKana, relation,
            postalCode, address1, address2, address3, phone1, phone2, fax, domicile,
            birthDate, deathDate, dharmaName, dharmaNameKana, note } = body;

    if (!familyName) {
      return NextResponse.json({ error: "姓は必須です" }, { status: 400 });
    }

    const member = await memberDelegate.create({
      data: {
        [fields.relationId]: householderId,
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

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error(`POST /api/householder/${id}/members error:`, error);
    return NextResponse.json({ error: (error as Error).message || "登録に失敗しました" }, { status: 500 });
  }
}
