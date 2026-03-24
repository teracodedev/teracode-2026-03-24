import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CeremonyStatus, CeremonyType } from "@prisma/client";
import { requireAuth } from "@/lib/require-auth";

export const runtime = "nodejs";

// 法要・行事一覧取得
export async function GET(request: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") as CeremonyType | null;
  const status = searchParams.get("status") as CeremonyStatus | null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const ceremonies = await prisma.ceremony.findMany({
      where: {
        title: query ? { contains: query, mode: "insensitive" } : undefined,
        ceremonyType: type || undefined,
        status: status || undefined,
        scheduledAt: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: {
        participants: {
          include: { householder: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json(ceremonies);
  } catch (error) {
    console.error("GET /api/ceremonies error:", error);
    return NextResponse.json({ error: (error as Error).message || "エラーが発生しました" }, { status: 500 });
  }
}

// 法要・行事新規登録
export async function POST(request: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

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
      note,
    } = body;

    if (!title || !ceremonyType || !scheduledAt) {
      return NextResponse.json(
        { error: "タイトル・種別・開催日時は必須です" },
        { status: 400 }
      );
    }

    const ceremony = await prisma.ceremony.create({
      data: {
        title,
        ceremonyType,
        scheduledAt: new Date(scheduledAt),
        endAt: endAt ? new Date(endAt) : null,
        location: location || null,
        description: description || null,
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
        fee: fee ? parseInt(fee) : null,
        note: note || null,
      },
      include: {
        participants: { include: { householder: true } },
      },
    });

    return NextResponse.json(ceremony, { status: 201 });
  } catch (error) {
    console.error("POST /api/ceremonies error:", error);
    return NextResponse.json({ error: (error as Error).message || "エラーが発生しました" }, { status: 500 });
  }
}
