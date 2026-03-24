import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;
  try {
    const register = await prisma.familyRegister.findUnique({
      where: { id },
      include: {
        householders: {
          include: { members: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!register) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    return NextResponse.json(register);
  } catch (e) {
    console.error("GET /api/family-register/[id] error:", e);
    return NextResponse.json({ error: "データ取得エラー" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;
  const { name, note } = await req.json();
  if (!name) return NextResponse.json({ error: "台帳名は必須です" }, { status: 400 });

  const register = await prisma.familyRegister.update({
    where: { id },
    data: { name, note: note || null },
  });
  return NextResponse.json(register);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;
  // 所属する戸主はfamilyRegisterId=nullにリセット（onDelete: SetNull）
  await prisma.familyRegister.delete({ where: { id } });
  return NextResponse.json({ message: "削除しました" });
}
