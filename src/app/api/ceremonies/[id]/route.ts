import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// 法要詳細取得
export async function GET(_request: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;
  const ceremonyId = id;

  try {
    const ceremony = await prisma.ceremony.findUnique({
      where: { id: ceremonyId },
      include: {
        participants: {
          include: { householder: true },
        },
      },
    });

    if (!ceremony) {
      return NextResponse.json({ error: "法要が見つかりません" }, { status: 404 });
    }

    return NextResponse.json(ceremony);
  } catch (error) {
    console.error(`GET /api/ceremonies/${id} error:`, error);
    return NextResponse.json({ error: (error as Error).message || "エラーが発生しました" }, { status: 500 });
  }
}

// 法要情報更新
export async function PUT(request: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;
  const ceremonyId = id;

  try {
    const body = await request.json();
    const {
      title,
      ceremonyType,
      scheduledAt,
      endAt,
      location,
      description,
      maxAttendees,
      fee,
      status,
      note,
    } = body;

    const maxAttendeesNum =
      typeof maxAttendees === "number"
        ? maxAttendees
        : typeof maxAttendees === "string"
          ? parseInt(maxAttendees, 10)
          : undefined;
    const feeNum = typeof fee === "number" ? fee : typeof fee === "string" ? parseInt(fee, 10) : undefined;

    const ceremony = await prisma.ceremony.update({
      where: { id: ceremonyId },
      data: {
        title,
        ceremonyType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        endAt: endAt ? new Date(endAt) : null,
        location: location || null,
        description: description || null,
        maxAttendees: maxAttendeesNum ?? null,
        fee: feeNum ?? null,
        status,
        note: note || null,
      },
      include: {
        participants: { include: { householder: true } },
      },
    });

    return NextResponse.json(ceremony);
  } catch (error) {
    console.error(`PUT /api/ceremonies/${id} error:`, error);
    return NextResponse.json({ error: (error as Error).message || "エラーが発生しました" }, { status: 500 });
  }
}

// 法要削除
export async function DELETE(_request: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;
  const ceremonyId = id;

  try {
    await prisma.ceremony.delete({ where: { id: ceremonyId } });
    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error(`DELETE /api/ceremonies/${id} error:`, error);
    return NextResponse.json({ error: (error as Error).message || "エラーが発生しました" }, { status: 500 });
  }
}
