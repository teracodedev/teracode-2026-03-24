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
        [relationName]: true,
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
