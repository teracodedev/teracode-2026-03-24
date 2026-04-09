import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/nenkai-hagaki?year=2026&month=4
 *
 * 指定された年・月に年回法要が該当する故人一覧を返す。
 * - deathDate の月 == 指定月
 * - (指定年 - 没年) が年回スケジュールに一致
 * - isAnnaiFuyo（案内不要）が false
 */

const NENKAI_YEARS: Record<number, string> = {
  1: "一周忌",
  2: "三回忌",
  6: "七回忌",
  12: "十三回忌",
  16: "十七回忌",
  24: "二十五回忌",
  32: "三十三回忌",
  49: "五十回忌",
};

export async function GET(request: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? "", 10);
  const month = parseInt(searchParams.get("month") ?? "", 10);

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "year と month を指定してください" },
      { status: 400 },
    );
  }

  // 年回に該当する没年を逆算
  const targetDeathYears = Object.entries(NENKAI_YEARS).map(
    ([diff, label]) => ({
      deathYear: year - Number(diff),
      label,
    }),
  );

  // 指定月に命日がある全故人を取得
  const members = await prisma.householderMember.findMany({
    where: {
      deathDate: { not: null },
      isAnnaiFuyo: false,
      isMeinichiFusho: false,
    },
    include: {
      householder: true,
    },
    orderBy: { deathDate: "asc" },
  });

  // 月と年回が一致するものだけフィルタ
  const results = members
    .filter((m) => {
      if (!m.deathDate) return false;
      const d = new Date(m.deathDate);
      if (d.getMonth() + 1 !== month) return false;
      const deathYear = d.getFullYear();
      return targetDeathYears.some((t) => t.deathYear === deathYear);
    })
    .map((m) => {
      const d = new Date(m.deathDate!);
      const deathYear = d.getFullYear();
      const diff = year - deathYear;
      const nenkaiLabel = NENKAI_YEARS[diff] ?? "";
      return {
        id: m.id,
        familyName: m.familyName,
        givenName: m.givenName,
        dharmaName: m.dharmaName,
        deathDate: m.deathDate,
        nenkaiLabel,
        householder: {
          id: m.householder.id,
          familyName: m.householder.familyName,
          givenName: m.householder.givenName,
          postalCode: m.householder.postalCode,
          address1: m.householder.address1,
          address2: m.householder.address2,
          address3: m.householder.address3,
        },
      };
    });

  return NextResponse.json(results);
}
