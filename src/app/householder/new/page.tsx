"use client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MemberForm {
  familyName: string;
  givenName: string;
  familyNameKana: string;
  givenNameKana: string;
  relation: string;
  birthDate: string;
  dharmaName: string;
  dharmaNameKana: string;
  note: string;
}

export default function NewHouseholderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    familyName: "",
    givenName: "",
    familyNameKana: "",
    givenNameKana: "",
    postalCode: "",
    address1: "",
    address2: "",
    address3: "",
    phone1: "",
    phone2: "",
    email: "",
    domicile: "",
    note: "",
    joinedAt: "",
  });

  const [members, setMembers] = useState<MemberForm[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addMember = () => {
    setMembers([...members, {
      familyName: "", givenName: "", familyNameKana: "", givenNameKana: "",
      relation: "", birthDate: "", dharmaName: "", dharmaNameKana: "", note: "",
    }]);
  };

  const updateMember = (index: number, field: keyof MemberForm, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetchWithAuth("/api/householder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, members: members.filter((m) => m.familyName) }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "登録に失敗しました");
        return;
      }

      const householder = await res.json();
      router.push(`/householder/${householder.id}`);
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
        <Link href="/householder" className="text-stone-400 hover:text-stone-600 text-sm">
          ← 一覧へ
        </Link>
        <h1 className="text-2xl font-bold text-amber-700">戸主新規登録</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
          <h2 className="font-semibold text-stone-700">基本情報</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                姓 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="familyName"
                value={form.familyName}
                onChange={handleChange}
                required
                placeholder="山田"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">
                名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="givenName"
                value={form.givenName}
                onChange={handleChange}
                required
                placeholder="太郎"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">姓（カナ）</label>
              <input
                type="text"
                name="familyNameKana"
                value={form.familyNameKana}
                onChange={handleChange}
                placeholder="ヤマダ"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">名（カナ）</label>
              <input
                type="text"
                name="givenNameKana"
                value={form.givenNameKana}
                onChange={handleChange}
                placeholder="タロウ"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">郵便番号</label>
              <input
                type="text"
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                placeholder="123-4567"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-stone-600 mb-1">住所1（都道府県・市区町村）</label>
              <input
                type="text"
                name="address1"
                value={form.address1}
                onChange={handleChange}
                placeholder="東京都渋谷区"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">住所2（丁目・番地）</label>
              <input
                type="text"
                name="address2"
                value={form.address2}
                onChange={handleChange}
                placeholder="神南1-2-3"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">住所3（建物名・部屋番号）</label>
              <input
                type="text"
                name="address3"
                value={form.address3}
                onChange={handleChange}
                placeholder="テラコードビル101"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">電話番号1</label>
              <input
                type="tel"
                name="phone1"
                value={form.phone1}
                onChange={handleChange}
                placeholder="03-1234-5678"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">電話番号2</label>
              <input
                type="tel"
                name="phone2"
                value={form.phone2}
                onChange={handleChange}
                placeholder="090-1234-5678"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">メールアドレス</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@example.com"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">本籍地</label>
            <input
              type="text"
              name="domicile"
              value={form.domicile}
              onChange={handleChange}
              placeholder="東京都千代田区〇〇番地"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">入檀日</label>
            <input
              type="date"
              name="joinedAt"
              value={form.joinedAt}
              onChange={handleChange}
              className="border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">備考</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={3}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-stone-700">世帯員</h2>
            <button
              type="button"
              onClick={addMember}
              className="text-sm text-stone-600 hover:text-stone-800 border border-stone-300 px-3 py-1 rounded-lg"
            >
              + 追加
            </button>
          </div>

          {members.length === 0 && (
            <p className="text-stone-400 text-sm">世帯員を追加できます</p>
          )}

          {members.map((member, index) => (
            <div key={index} className="border border-stone-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-stone-600">世帯員 {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="text-red-400 hover:text-red-600 text-sm"
                >
                  削除
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-stone-500 mb-1">姓 *</label>
                  <input
                    type="text"
                    value={member.familyName}
                    onChange={(e) => updateMember(index, "familyName", e.target.value)}
                    placeholder="山田"
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-500 mb-1">名</label>
                  <input
                    type="text"
                    value={member.givenName}
                    onChange={(e) => updateMember(index, "givenName", e.target.value)}
                    placeholder="花子"
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-500 mb-1">姓（カナ）</label>
                  <input
                    type="text"
                    value={member.familyNameKana}
                    onChange={(e) => updateMember(index, "familyNameKana", e.target.value)}
                    placeholder="ヤマダ"
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-500 mb-1">名（カナ）</label>
                  <input
                    type="text"
                    value={member.givenNameKana}
                    onChange={(e) => updateMember(index, "givenNameKana", e.target.value)}
                    placeholder="ハナコ"
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-500 mb-1">続柄</label>
                  <input
                    type="text"
                    value={member.relation}
                    onChange={(e) => updateMember(index, "relation", e.target.value)}
                    placeholder="妻・子など"
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-500 mb-1">生年月日</label>
                  <input
                    type="date"
                    value={member.birthDate}
                    onChange={(e) => updateMember(index, "birthDate", e.target.value)}
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-500 mb-1">法名</label>
                  <input
                    type="text"
                    value={member.dharmaName}
                    onChange={(e) => updateMember(index, "dharmaName", e.target.value)}
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-500 mb-1">法名（カナ）</label>
                  <input
                    type="text"
                    value={member.dharmaNameKana}
                    onChange={(e) => updateMember(index, "dharmaNameKana", e.target.value)}
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
              </div>
            </div>
          ))}
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
            href="/householder"
            className="border border-stone-300 text-stone-600 px-6 py-2 rounded-lg hover:bg-stone-50 transition-colors text-base font-medium"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
