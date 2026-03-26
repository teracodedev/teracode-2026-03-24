import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // 未ログインはログインページへ
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 管理者専用パス
  if (pathname.startsWith("/admin") && !req.auth?.user?.isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * 否定パターンは path-to-regexp の解釈で漏れることがあるため、
     * 「認証を掛けたいページ」だけを明示列挙する。それ以外（/_next, /api, /login,
     * 静的ファイル等）ではミドルウェアは一切動かない。
     */
    "/",
    "/admin",
    "/admin/:path*",
    "/ceremonies",
    "/ceremonies/:path*",
    "/family-register",
    "/family-register/:path*",
    "/genzaicho",
    "/householder",
    "/householder/:path*",
    "/kakocho",
  ],
};
