import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// 参加者追加
export async function POST(request: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;
  const ceremonyId = id;

  try {
    const body = await request.json();
    const { householderId, attendees, offering, note } = body;

    if (typeof ceremonyId !== "string" || !ceremonyId || typeof householderId !== "string" || !householderId) {
      return NextResponse.json({ error: "戸主IDは必須です" }, { status: 400 });
    }

    const attendeesNum =
      typeof attendees === "number" ? attendees : typeof attendees === "string" ? parseInt(attendees, 10) : undefined;
    const offeringNum =
      typeof offering === "number" ? offering : typeof offering === "string" ? parseInt(offering, 10) : undefined;

    const participant = await prisma.ceremonyParticipant.upsert({
      where: {
        ceremonyId_householderId: { ceremonyId, householderId },
      },
      update: {
        attendees: attendeesNum ?? 1,
        offering: offeringNum ?? null,
        note: note || null,
      },
      create: {
        ceremonyId,
        householderId,
        attendees: attendeesNum ?? 1,
        offering: offeringNum ?? null,
        note: note || null,
      },
      include: { householder: true },
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error(`POST /api/ceremonies/${id}/participants error:`, error);
    return NextResponse.json({ error: (error as Error).message || "エラーが発生しました" }, { status: 500 });
  }
}

// 参加者削除
export async function DELETE(request: NextRequest, { params }: Params) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { id } = await params;
  const ceremonyId = id;
  const searchParams = request.nextUrl.searchParams;
  const householderId = searchParams.get("householderId");

  if (!ceremonyId || !householderId) {
    return NextResponse.json({ error: "不正なパラメータ" }, { status: 400 });
  }

  try {
    await prisma.ceremonyParticipant.delete({
      where: {
        ceremonyId_householderId: { ceremonyId, householderId },
      },
    });

    return NextResponse.json({ message: "参加者を削除しました" });
  } catch (error) {
    console.error(`DELETE /api/ceremonies/${id}/participants error:`, error);
    return NextResponse.json({ error: (error as Error).message || "エラーが発生しました" }, { status: 500 });
  }
}
