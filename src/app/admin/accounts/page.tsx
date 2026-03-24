"use client";

import { useState, useEffect, useCallback } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
};

export default function AccountsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 新規登録フォーム
  const [form, setForm] = useState({ name: "", email: "", password: "", isAdmin: false });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/accounts");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    setSubmitting(true);

    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setFormError(data.error || "登録に失敗しました");
    } else {
      setSuccess(`「${data.name}」のアカウントを登録しました`);
      setForm({ name: "", email: "", password: "", isAdmin: false });
      fetchUsers();
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`「${user.name}」のアカウントを削除しますか？`)) return;
    setError("");
    setSuccess("");

    const res = await fetch(`/api/admin/accounts/${user.id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "削除に失敗しました");
    } else {
      setSuccess(`「${user.name}」のアカウントを削除しました`);
      fetchUsers();
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-amber-700">アカウント管理</h1>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
      )}

      {/* ユーザー一覧 */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-700">登録アカウント一覧</h2>
        </div>
        {loading ? (
          <div className="p-6 text-stone-400 text-sm">読み込み中...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-stone-400 text-sm">アカウントがありません</div>
        ) : (
          <table className="w-full text-base">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500">名前</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500">メールアドレス</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500">権限</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500">登録日</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50">
                  <td className="px-6 py-3 font-medium text-stone-700">{user.name}</td>
                  <td className="px-6 py-3 text-stone-600">{user.email}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.isAdmin ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"}`}>
                      {user.isAdmin ? "管理者" : "一般"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-stone-500">{new Date(user.createdAt).toLocaleDateString("ja-JP")}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 新規登録フォーム */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-700">新規アカウント登録</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">名前 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
                placeholder="山田 太郎"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">メールアドレス *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
                placeholder="example@temple.or.jp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">パスワード * (8文字以上)</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAdmin}
                  onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })}
                  className="w-4 h-4 rounded border-stone-300"
                />
                <span className="text-sm font-medium text-stone-600">管理者権限を付与</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-stone-800 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "登録中..." : "アカウントを登録"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
