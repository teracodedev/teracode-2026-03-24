"use client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Ceremony {
  id: number;
  title: string;
  ceremonyType: string;
  scheduledAt: string;
  location: string | null;
  status: string;
  participants: { id: number }[];
}

const CEREMONY_TYPE_LABELS: Record<string, string> = {
  MEMORIAL: "法要",
  REGULAR: "定例行事",
  FUNERAL: "葬儀・告別式",
  SPECIAL: "特別行事",
  OTHER: "その他",
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "予定",
  COMPLETED: "完了",
  CANCELLED: "中止",
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-stone-100 text-stone-500",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function CeremoniesPage() {
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCeremonies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetchWithAuth(`/api/ceremonies?${params}`);
      const data = await res.json();
      setCeremonies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [query, filterType, filterStatus]);

  useEffect(() => {
    const timer = setTimeout(fetchCeremonies, 300);
    return () => clearTimeout(timer);
  }, [fetchCeremonies]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-700">法要・行事</h1>
        <Link
          href="/ceremonies/new"
          className="bg-stone-700 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors text-base font-medium"
        >
          + 新規登録
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="名称で検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-48 border border-stone-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
        >
          <option value="">全ての種別</option>
          {Object.entries(CEREMONY_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
        >
          <option value="">全てのステータス</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-stone-400">読み込み中...</div>
      ) : ceremonies.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <p>法要・行事が登録されていません</p>
          <Link href="/ceremonies/new" className="text-stone-600 underline mt-2 inline-block">
            最初の法要・行事を登録する
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {ceremonies.map((ceremony) => (
            <Link
              key={ceremony.id}
              href={`/ceremonies/${ceremony.id}`}
              className="block bg-white rounded-xl shadow-sm border border-stone-200 p-5 hover:shadow-md hover:border-stone-300 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-stone-800">{ceremony.title}</h2>
                    <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                      {CEREMONY_TYPE_LABELS[ceremony.ceremonyType] || ceremony.ceremonyType}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ceremony.status] || "bg-stone-100 text-stone-500"}`}>
                      {STATUS_LABELS[ceremony.status] || ceremony.status}
                    </span>
                  </div>
                  <div className="text-sm text-stone-500">
                    {formatDate(ceremony.scheduledAt)}
                    {ceremony.location && <span className="ml-3">📍 {ceremony.location}</span>}
                  </div>
                </div>
                <div className="text-sm text-stone-400 whitespace-nowrap">
                  参加: {(ceremony.participants ?? []).length}件
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
