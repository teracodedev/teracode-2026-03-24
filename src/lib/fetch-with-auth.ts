/**
 * fetch のラッパー。401 が返った場合はログイン画面にリダイレクトする。
 * Client Component の useEffect 内で fetch の代わりに使用する。
 */
export async function fetchWithAuth(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401) {
    window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    // リダイレクト後にコードが進まないよう例外を投げる
    throw new Error("Unauthorized");
  }
  return res;
}
