import Link from "next/link";
import { loginAction } from "./actions";

function normalizeCallbackUrl(
  raw: string | string[] | undefined
): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string") return "/";
  if (!v.startsWith("/") || v.startsWith("//")) return "/";
  return v;
}

function normalizeError(raw: string | string[] | undefined) {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "credentials" || v === "invalid") return v;
  return undefined;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
    error?: string | string[];
  }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const callbackUrl = normalizeCallbackUrl(sp.callbackUrl);
  const error = normalizeError(sp.error);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2" suppressHydrationWarning>
            ⛩
          </div>
          <h1 className="text-2xl font-bold text-stone-800">テラコード</h1>
          <p className="text-stone-500 text-sm mt-1">寺院管理システム</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8">
          <h2 className="text-lg font-semibold text-stone-700 mb-6">ログイン</h2>

          {error === "credentials" && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              メールアドレスまたはパスワードが正しくありません
            </div>
          )}
          {error === "invalid" && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              入力が不正です
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="w-full border border-stone-300 rounded-lg px-4 py-2 text-base text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
                placeholder="example@temple.or.jp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                パスワード
              </label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="w-full border border-stone-300 rounded-lg px-4 py-2 text-base text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-stone-800 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-stone-700 transition-colors mt-2"
            >
              ログイン
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            <Link href="/" className="text-stone-600 hover:text-stone-800 underline">
              トップへ戻る
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
