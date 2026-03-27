import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { matchesNormalizedSearch } from "@/lib/search-normalize";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const q = req.nextUrl.searchParams.get("q")?.trim() || "";

  try {
    const registers = await prisma.familyRegister.findMany({
      include: {
        householders: {
          select: { id: true, familyName: true, givenName: true, familyNameKana: true, givenNameKana: true, isActive: true, address1: true, phone1: true, _count: { select: { members: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const filtered = registers.filter((register) =>
      matchesNormalizedSearch(q, [
        register.name,
        ...register.householders.flatMap((householder) => [
          householder.familyName,
          householder.givenName,
          `${householder.familyName} ${householder.givenName ?? ""}`,
          `${householder.familyName}${householder.givenName ?? ""}`,
          householder.familyNameKana,
          householder.givenNameKana,
          `${householder.familyNameKana ?? ""} ${householder.givenNameKana ?? ""}`,
          `${householder.familyNameKana ?? ""}${householder.givenNameKana ?? ""}`,
          householder.address1,
          householder.phone1,
        ]),
      ])
    );
    return NextResponse.json(filtered);
  } catch (e) {
    console.error("GET /api/family-register error:", e);
    return NextResponse.json({ error: "データ取得エラー" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { name, note } = await req.json();
  if (!name) return NextResponse.json({ error: "台帳名は必須です" }, { status: 400 });

  const register = await prisma.familyRegister.create({ data: { name, note: note || null } });
  return NextResponse.json(register, { status: 201 });
}
