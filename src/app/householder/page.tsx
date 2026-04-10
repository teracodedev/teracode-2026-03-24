"use client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Householder {
  id: string;
  householderCode: string;
  familyName: string;
  givenName: string;
  familyNameKana: string | null;
  givenNameKana: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  phone1: string | null;
  phone2: string | null;
  isActive: boolean;
  familyRegister: { id: string; name: string } | null;
  members: { id: string; familyName: string; givenName: string | null; relation: string | null }[];
}

export default function HouseholderPage() {
  const [householderList, setHouseholderList] = useState<Householder[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; errors: number; results: { file: string; status: string; name?: string; error?: string }[] } | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    for (const f of Array.from(files)) formData.append("files", f);
    try {
      const res = await fetchWithAuth("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      setImportResult({
        ok: typeof data?.ok === "number" ? data.ok : 0,
        errors: typeof data?.errors === "number" ? data.errors : 0,
        results: Array.isArray(data?.results) ? data.results : [],
      });
      if (typeof data?.ok === "number" && data.ok > 0) fetchHouseholders();
    } catch {
      setImportResult({ ok: 0, errors: 1, results: [{ file: "—", status: "error", error: "通信エラー" }] });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const fetchHouseholders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      const res = await fetchWithAuth(`/api/householder?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setHouseholderList([]);
        setError(data?.error || "データの取得に失敗しました");
        return;
      }

      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => {
        const ka = (a.familyNameKana ?? a.familyName) + (a.givenNameKana ?? a.givenName);
        const kb = (b.familyNameKana ?? b.familyName) + (b.givenNameKana ?? b.givenName);
        return ka.localeCompare(kb, "ja");
      });
      setHouseholderList(sorted);
    } catch (err) {
      console.error(err);
      setHouseholderList([]);
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(fetchHouseholders, 300);
    return () => clearTimeout(timer);
  }, [fetchHouseholders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-amber-700">戸主台帳</h1>
        <div className="flex gap-2 flex-wrap">
          <label className={`border border-stone-300 text-stone-600 px-4 py-2 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium cursor-pointer ${importing ? "opacity-50 pointer-events-none" : ""}`}>
            {importing ? "インポート中..." : "⬆ インポート"}
            <input type="file" accept=".yaml,.yml" multiple className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <Link
            href="/householder/new"
            className="bg-stone-700 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors text-sm font-medium"
          >
            + 新規登録
          </Link>
        </div>
      </div>

      {importResult && (
        <div className={`rounded-lg px-4 py-3 text-sm ${importResult.errors > 0 ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"}`}>
          <p className="font-medium mb-1">{importResult.ok}件 成功 / {importResult.errors}件 エラー</p>
          <ul className="space-y-0.5 text-xs">
            {importResult.results.map((r, i) => (
              <li key={i} className={r.status === "ok" ? "text-green-700" : "text-red-600"}>
                {r.status === "ok" ? "✓" : "✗"} {r.name || r.file}{r.error ? `：${r.error}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="氏名・住所で検索..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
          className="flex-1 border border-stone-300 rounded-lg px-4 py-2 text-base text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-stone-400">読み込み中...</div>
      ) : error ? (
        <div className="text-center py-12 text-stone-400">{error}</div>
      ) : householderList.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <p>戸主が登録されていません</p>
          <Link href="/householder/new" className="text-stone-600 underline mt-2 inline-block">
            最初の戸主を登録する
          </Link>
        </div>
      ) : (
        <>
          {/* モバイル: カード表示 */}
          <div className="md:hidden space-y-2">
            {householderList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((householder) => (
              <div
                key={householder.id}
                className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden"
              >
                <Link
                  href={`/householder/${householder.id}`}
                  className="block px-4 py-3 active:bg-stone-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-stone-800 text-base">
                        {householder.familyName} {householder.givenName}
                      </div>
                      {householder.familyNameKana && (
                        <div className="text-xs text-stone-400">
                          {householder.familyNameKana} {householder.givenNameKana}
                        </div>
                      )}
                      <div className="text-xs text-stone-500 mt-1">
                        {[householder.address1, householder.address2, householder.address3].filter(Boolean).join(" ") || "-"}
                      </div>
                      {householder.phone1 && (
                        <div className="text-xs text-stone-500">{householder.phone1}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-stone-400">{householder.members.length}名</span>
                    </div>
                  </div>
                </Link>
                {householder.familyRegister ? (
                  <Link
                    href={`/family-register/${householder.familyRegister.id}`}
                    className="block px-4 py-2 border-t border-stone-100 text-xs text-amber-800 bg-amber-50/50 hover:bg-amber-50"
                  >
                    {householder.familyRegister.name}
                  </Link>
                ) : (
                  <div className="px-4 py-2 border-t border-stone-100 text-xs text-stone-400 bg-stone-50/40">
                    家族・親族台帳未紐付け
                  </div>
                )}
              </div>
            ))}
            <div className="text-xs text-stone-400 px-1 pt-1">{householderList.length}件中 {Math.min((currentPage - 1) * PAGE_SIZE + 1, householderList.length)}〜{Math.min(currentPage * PAGE_SIZE, householderList.length)}件表示</div>
          </div>

          {/* デスクトップ: テーブル表示 */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <table className="w-full text-base">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-3 text-stone-600 font-medium">戸主氏名</th>
                  <th className="text-left px-4 py-3 text-stone-600 font-medium">フリガナ</th>
                  <th className="text-left px-4 py-3 text-stone-600 font-medium">所属グループ</th>
                  <th className="text-left px-4 py-3 text-stone-600 font-medium">住所</th>
                  <th className="text-left px-4 py-3 text-stone-600 font-medium">電話番号1</th>
                  <th className="text-left px-4 py-3 text-stone-600 font-medium">電話番号2</th>
                  <th className="text-left px-4 py-3 text-stone-600 font-medium whitespace-nowrap">詳細・編集</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {householderList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((householder) => (
                  <tr key={householder.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 text-stone-800">
                      {householder.familyName} {householder.givenName}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {householder.familyNameKana || householder.givenNameKana
                        ? `${householder.familyNameKana ?? ""} ${householder.givenNameKana ?? ""}`.trim()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {householder.familyRegister ? (
                        <Link
                          href={`/family-register/${householder.familyRegister.id}`}
                          className="text-amber-700 hover:text-amber-800 hover:underline text-sm"
                        >
                          {householder.familyRegister.name}
                        </Link>
                      ) : (
                        <span className="text-stone-300 text-sm">未設定</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {[householder.address1, householder.address2, householder.address3].filter(Boolean).join(" ") || "-"}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{householder.phone1 || ""}</td>
                    <td className="px-4 py-3 text-stone-600">{householder.phone2 || ""}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <Link href={`/householder/${householder.id}`} className="text-amber-700 hover:text-amber-800 hover:underline">
                        詳細・編集
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-400">
              {householderList.length}件中 {Math.min((currentPage - 1) * PAGE_SIZE + 1, householderList.length)}〜{Math.min(currentPage * PAGE_SIZE, householderList.length)}件表示
            </div>
          </div>

          {/* ページネーション */}
          {Math.ceil(householderList.length / PAGE_SIZE) > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← 前へ
              </button>
              <span className="text-sm text-stone-500">{currentPage} / {Math.ceil(householderList.length / PAGE_SIZE)}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(householderList.length / PAGE_SIZE), p + 1))}
                disabled={currentPage === Math.ceil(householderList.length / PAGE_SIZE)}
                className="px-3 py-1.5 text-sm border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                次へ →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
