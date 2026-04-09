import { NextRequest, NextResponse } from "next/server";
import { getMemberDelegate } from "@/lib/prisma-models";
import { requireAuth } from "@/lib/require-auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// 過去帳フラグの即時更新（チェックボックス操作）
export async function PATCH(request: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;

  try {
    const memberDelegate = getMemberDelegate() as {
      update: (args: unknown) => Promise<unknown>;
    };

    const body = await request.json();
    const allowed = ["isAnnaiFuyo", "isKeijiFuyo", "isNotePrintDisabled", "isMeinichiFusho"] as const;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) data[key] = Boolean(body[key]);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "更新するフラグがありません" }, { status: 400 });
    }

    const member = await memberDelegate.update({ where: { id }, data });
    return NextResponse.json(member);
  } catch (error) {
    console.error(`PATCH /api/kakocho/${id}/flags error:`, error);
    return NextResponse.json(
      { error: (error as Error).message || "更新に失敗しました" },
      { status: 500 }
    );
  }
}
