"use client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface FamilyRegister {
  id: string;
  registerCode: string;
  name: string;
  note: string | null;
  householders: {
    id: string;
    familyName: string;
    givenName: string;
    familyNameKana: string | null;
    givenNameKana: string | null;
    isActive: boolean;
    address1: string | null;
    phone1: string | null;
    _count: { members: number };
  }[];
}

export default function FamilyRegisterPage() {
  const [list, setList] = useState<FamilyRegister[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      const res = await fetchWithAuth(`/api/family-register?${params}`);
      const data = await res.json();
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => {
        const hhA = a.householders[0];
        const hhB = b.householders[0];
        const ka = hhA
          ? (hhA.familyNameKana ?? hhA.familyName) + (hhA.givenNameKana ?? hhA.givenName ?? "")
          : a.name;
        const kb = hhB
          ? (hhB.familyNameKana ?? hhB.familyName) + (hhB.givenNameKana ?? hhB.givenName ?? "")
          : b.name;
        return ka.localeCompare(kb, "ja");
      });
      setList(sorted);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(fetchList, 300);
    return () => clearTimeout(timer);
  }, [fetchList]);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-amber-700">家族・親族台帳</h1>
        <Link
          href="/family-register/new"
          className="bg-stone-700 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors text-sm font-medium"
        >
          + 新規登録
        </Link>
      </div>

      {/* 検索窓 */}
      <div>
        <input
          type="text"
          placeholder="台帳名・戸主氏名で検索..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
          className="w-full border border-stone-300 rounded-lg px-4 py-2 text-base text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-stone-400">読み込み中...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          {query ? (
            <p>「{query}」に一致する台帳が見つかりません</p>
          ) : (
            <>
              <p>家族・親族台帳が登録されていません</p>
              <Link href="/family-register/new" className="text-stone-600 underline mt-2 inline-block">
                最初の台帳を登録する
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          {/* モバイル: カード表示 */}
          <div className="md:hidden space-y-2">
            {list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((r) => {
              const hh = r.householders[0];
              const memberCount = r.householders.reduce((s, h) => s + (h._count?.members ?? 0), 0);
              return (
                <Link
                  key={r.id}
                  href={`/family-register/${r.id}`}
                  className="block bg-white rounded-xl border border-stone-200 px-4 py-3 shadow-sm active:bg-stone-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-stone-800 text-base">{r.name}</div>
                      {hh && (
                        <>
                          <div className="text-sm text-stone-600 mt-0.5">
                            戸主: {hh.familyName} {hh.givenName}
                            {hh.familyNameKana && (
                              <span className="ml-1 text-xs text-stone-400">
                                ({hh.familyNameKana} {hh.givenNameKana})
                              </span>
                            )}
                          </div>
                          {hh.address1 && (
                            <div className="text-xs text-stone-500 mt-0.5">{hh.address1}</div>
                          )}
                        </>
                      )}
                      {r.note && <div className="text-xs text-stone-400 mt-1">{r.note}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {hh && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          hh.isActive ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                        }`}>
                          {hh.isActive ? "在籍" : "離檀"}
                        </span>
                      )}
                      <span className="text-xs text-stone-400">{memberCount}世帯員</span>
                    </div>
                  </div>
                </Link>
              );
            })}
            <div className="text-xs text-stone-400 px-1 pt-1">{list.length}件中 {Math.min((currentPage - 1) * PAGE_SIZE + 1, list.length)}〜{Math.min(currentPage * PAGE_SIZE, list.length)}件表示</div>
          </div>

          {/* デスクトップ: テーブル表示 */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <table className="w-full text-base">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-3 text-stone-600 font-medium">台帳名</th>
                  <th className="text-left px-4 py-3 text-stone-600 font-medium">戸主</th>
                  <th className="text-left px-4 py-3 text-stone-600 font-medium">住所</th>
                  <th className="text-left px-4 py-3 text-stone-600 font-medium">電話番号</th>
                  <th className="text-left px-4 py-3 text-stone-600 font-medium">世帯員数</th>
                  <th className="text-left px-4 py-3 text-stone-600 font-medium">状態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((r) => {
                  const hh = r.householders[0];
                  const memberCount = r.householders.reduce((s, h) => s + (h._count?.members ?? 0), 0);
                  return (
                    <tr key={r.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/family-register/${r.id}`}
                          className="font-medium text-amber-700 hover:text-amber-800 hover:underline"
                        >
                          {r.name}
                        </Link>
                        {r.note && <div className="text-xs text-stone-400">{r.note}</div>}
                      </td>
                      <td className="px-4 py-3 text-stone-700">
                        {hh ? (
                          <>
                            <Link href={`/householder/${hh.id}`} className="hover:text-amber-700 hover:underline">
                              {hh.familyName} {hh.givenName}
                            </Link>
                            {hh.familyNameKana && (
                              <div className="text-xs text-stone-400">
                                {hh.familyNameKana} {hh.givenNameKana}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-stone-300 text-sm">未設定</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {hh?.address1 || "-"}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {hh?.phone1 || "-"}
                      </td>
                      <td className="px-4 py-3 text-stone-600">{memberCount}名</td>
                      <td className="px-4 py-3">
                        {hh ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            hh.isActive ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                          }`}>
                            {hh.isActive ? "在籍" : "離檀"}
                          </span>
                        ) : (
                          <span className="text-stone-300 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-400">
              {list.length}件中 {Math.min((currentPage - 1) * PAGE_SIZE + 1, list.length)}〜{Math.min(currentPage * PAGE_SIZE, list.length)}件表示
            </div>
          </div>

          {/* ページネーション */}
          {Math.ceil(list.length / PAGE_SIZE) > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← 前へ
              </button>
              <span className="text-sm text-stone-500">{currentPage} / {Math.ceil(list.length / PAGE_SIZE)}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(list.length / PAGE_SIZE), p + 1))}
                disabled={currentPage === Math.ceil(list.length / PAGE_SIZE)}
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
