import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * API ルートで認証を要求するユーティリティ。
 * セッションがなければ 401 レスポンスを返す。
 *
 * Usage:
 *   const unauth = await requireAuth();
 *   if (unauth) return unauth;
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
