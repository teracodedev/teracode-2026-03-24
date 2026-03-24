"use client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewFamilyRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetchWithAuth("/api/family-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, note }),
      });
      if (!res.ok) { setError((await res.json()).error || "登録に失敗しました"); return; }
      const data = await res.json();
      router.push(`/family-register/${data.id}`);
    } catch { setError("ネットワークエラーが発生しました"); }
    finally { setSubmitting(false); }
  };

  const cls = "w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400";

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/family-register" className="text-stone-400 hover:text-stone-600 text-sm">← 一覧へ</Link>
        <h1 className="text-2xl font-bold text-amber-700">家族・親族台帳 新規登録</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">台帳名 <span className="text-red-500">*</span></label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
            placeholder="例: 山田家" className={cls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">備考</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={cls} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting}
            className="bg-stone-700 text-white px-6 py-2 rounded-lg hover:bg-stone-800 transition-colors text-base font-medium disabled:opacity-50">
            {submitting ? "登録中..." : "登録する"}
          </button>
          <Link href="/family-register"
            className="border border-stone-300 text-stone-600 px-6 py-2 rounded-lg hover:bg-stone-50 transition-colors text-base font-medium">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
