import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** 戸主をこの家族・親族台帳に紐付け */
export async function POST(req: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;
  const { householderId } = await req.json();
  if (!householderId) return NextResponse.json({ error: "householderIdは必須です" }, { status: 400 });

  await prisma.householder.update({
    where: { id: householderId },
    data: { familyRegisterId: id },
  });
  return NextResponse.json({ message: "紐付けしました" });
}

/** 戸主の紐付けを解除（DELETE /api/family-register/[id]/householders?householderId=xxx） */
export async function DELETE(req: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  await params; // id not needed for update
  const householderId = req.nextUrl.searchParams.get("householderId");
  if (!householderId) return NextResponse.json({ error: "householderIdが必要です" }, { status: 400 });

  await prisma.householder.update({
    where: { id: householderId },
    data: { familyRegisterId: null },
  });
  return NextResponse.json({ message: "紐付けを解除しました" });
}
