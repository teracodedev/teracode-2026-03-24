"use client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface KakuchoRecord {
  id: string;
  householderId: string;
  familyName: string;
  givenName: string | null;
  familyNameKana: string | null;
  givenNameKana: string | null;
  relation: string | null;
  birthDate: string | null;
  deathDate: string | null;
  dharmaName: string | null;
  dharmaNameKana: string | null;
  note: string | null;
  householder: {
    id: string;
    householderCode: string;
    familyName: string;
    givenName: string;
    familyRegister: { id: string; name: string } | null;
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
}

function calcAge(birthDate: string | null, deathDate: string | null): string {
  if (!birthDate || !deathDate) return "-";
  const birth = new Date(birthDate);
  const death = new Date(deathDate);
  let age = death.getFullYear() - birth.getFullYear();
  if (
    death.getMonth() < birth.getMonth() ||
    (death.getMonth() === birth.getMonth() && death.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age + "才";
}

const PAGE_SIZE = 70;

export default function KakuchoPage() {
  const [records, setRecords] = useState<KakuchoRecord[]>([]);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRecords = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const res = await fetchWithAuth("/api/kakucho?" + params);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      setRecords(
        rows.filter(
          (r): r is KakuchoRecord =>
            r != null &&
            typeof r === "object" &&
            typeof (r as KakuchoRecord).householder?.id === "string"
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords("");
  }, [fetchRecords]);

  const handleSearch = () => {
    setSubmittedQuery(query);
    setCurrentPage(1);
    fetchRecords(query);
  };

  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const pagedRecords = records.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center text-stone-800">過去帳(物故者リスト)</h1>

      {/* 検索条件 */}
      <div className="border border-stone-300 rounded-lg p-6 max-w-2xl mx-auto">
        <h2 className="text-center text-lg font-medium text-stone-700 mb-4">検索条件</h2>
        <div className="mb-4">
          <label className="block text-sm text-stone-600 mb-1">
            検索文字列（スペース区切りで複数可）
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            className="w-full border border-stone-300 rounded px-3 py-2 text-base text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        <div className="text-center">
          <button
            onClick={handleSearch}
            className="bg-green-700 hover:bg-green-800 text-white font-medium px-12 py-2 rounded"
          >
            検索
          </button>
        </div>
      </div>

      {/* 検索結果 */}
      <div>
        <h2 className="text-xl font-bold text-stone-800 mb-1">検索結果</h2>
        {!loading && (
          <p className="text-sm text-stone-600 mb-3">{records.length}件のデータが見つかりました。</p>
        )}

        {loading ? (
          <div className="text-center py-12 text-stone-400">読み込み中...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <p>過去帳の記録がありません</p>
            <p className="text-xs mt-2">
              戸主の世帯員に命日を登録すると過去帳に表示されます
            </p>
          </div>
        ) : (
          <>
            {/* デスクトップテーブル */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-stone-300">
                    <th className="text-left px-3 py-2 text-stone-700 font-medium">氏名</th>
                    <th className="text-left px-3 py-2 text-stone-700 font-medium">フリガナ</th>
                    <th className="text-left px-3 py-2 text-stone-700 font-medium">法名</th>
                    <th className="text-left px-3 py-2 text-stone-700 font-medium">命日</th>
                    <th className="text-left px-3 py-2 text-stone-700 font-medium">享年</th>
                    <th className="text-left px-3 py-2 text-stone-700 font-medium">続柄</th>
                    <th className="text-left px-3 py-2 text-stone-700 font-medium">詳細・編集</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRecords.map((record) => (
                    <tr key={record.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="px-3 py-2 text-stone-800">
                        {record.familyName} {record.givenName || ""}
                      </td>
                      <td className="px-3 py-2 text-stone-600">
                        {record.familyNameKana || record.givenNameKana
                          ? `${record.familyNameKana || ""} ${record.givenNameKana || ""}`.trim()
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-stone-700">
                        {record.dharmaName || <span className="text-stone-300">未登録</span>}
                      </td>
                      <td className="px-3 py-2 text-stone-600">{formatDate(record.deathDate)}</td>
                      <td className="px-3 py-2 text-stone-600">{calcAge(record.birthDate, record.deathDate)}</td>
                      <td className="px-3 py-2 text-stone-600">{record.relation || "-"}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/members/${record.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          詳細・編集
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* モバイルカード */}
            <div className="md:hidden space-y-2">
              {pagedRecords.map((record) => (
                <div
                  key={record.id}
                  className="bg-white rounded-xl border border-stone-200 px-4 py-3 shadow-sm"
                >
                  <div className="font-medium text-stone-800">
                    {record.familyName} {record.givenName || ""}
                  </div>
                  {(record.familyNameKana || record.givenNameKana) && (
                    <div className="text-xs text-stone-400">{record.familyNameKana || ""} {record.givenNameKana || ""}</div>
                  )}
                  <div className="text-sm text-stone-600 mt-0.5">
                    {record.dharmaName || <span className="text-stone-400">法名未登録</span>}
                  </div>
                  <div className="text-xs text-stone-500 mt-1 flex flex-wrap gap-x-2">
                    {record.relation && <span>{record.relation}</span>}
                    {record.deathDate && <span>命日: {formatDate(record.deathDate)}</span>}
                    <span>享年: {calcAge(record.birthDate, record.deathDate)}</span>
                  </div>
                  <div className="mt-1">
                    <Link href={`/members/${record.id}`} className="text-blue-600 text-xs hover:underline">
                      詳細・編集
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center flex-wrap gap-1 mt-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2.5 py-1 text-sm rounded border ${
                      page === currentPage
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
