"use client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CEREMONY_TYPES = [
  { value: "MEMORIAL", label: "法要（年忌法要など）" },
  { value: "REGULAR", label: "定例行事（彼岸・盂蘭盆など）" },
  { value: "FUNERAL", label: "葬儀・告別式" },
  { value: "SPECIAL", label: "特別行事" },
  { value: "OTHER", label: "その他" },
];

export default function NewCeremonyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    ceremonyType: "MEMORIAL",
    scheduledAt: "",
    endAt: "",
    location: "",
    description: "",
    maxAttendees: "",
    fee: "",
    note: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetchWithAuth("/api/ceremonies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "登録に失敗しました");
        return;
      }

      const ceremony = await res.json();
      router.push(`/ceremonies/${ceremony.id}`);
    } catch (err) {
      console.error(err);
      setError("ネットワークエラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ceremonies" className="text-stone-400 hover:text-stone-600 text-sm">
          ← 一覧へ
        </Link>
        <h1 className="text-2xl font-bold text-amber-700">法要・行事新規登録</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="例: 山田家 三回忌"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">
              種別 <span className="text-red-500">*</span>
            </label>
            <select
              name="ceremonyType"
              value={form.ceremonyType}
              onChange={handleChange}
              required
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
            >
              {CEREMONY_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                開催日時 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={form.scheduledAt}
                onChange={handleChange}
                required
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">終了日時</label>
              <input
                type="datetime-local"
                name="endAt"
                value={form.endAt}
                onChange={handleChange}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">場所</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="本堂・○○寺など"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">定員</label>
              <input
                type="number"
                name="maxAttendees"
                value={form.maxAttendees}
                onChange={handleChange}
                min="0"
                placeholder="人数"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">費用（円）</label>
              <input
                type="number"
                name="fee"
                value={form.fee}
                onChange={handleChange}
                min="0"
                placeholder="金額"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">説明</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">備考</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={2}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-stone-700 text-white px-6 py-2 rounded-lg hover:bg-stone-800 transition-colors text-base font-medium disabled:opacity-50"
          >
            {submitting ? "登録中..." : "登録する"}
          </button>
          <Link
            href="/ceremonies"
            className="border border-stone-300 text-stone-600 px-6 py-2 rounded-lg hover:bg-stone-50 transition-colors text-base font-medium"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
