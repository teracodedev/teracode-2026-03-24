"use client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Householder {
  id: number;
  familyName: string;
  givenName: string;
  householderCode: string;
}

interface Participant {
  id: number;
  householderId: number;
  attendees: number;
  offering: number | null;
  note: string | null;
  householder: Householder;
}

interface CeremonyDetail {
  id: number;
  title: string;
  ceremonyType: string;
  scheduledAt: string;
  endAt: string | null;
  location: string | null;
  description: string | null;
  maxAttendees: number | null;
  fee: number | null;
  status: string;
  note: string | null;
  participants: Participant[];
}

function isCeremonyDetail(v: unknown): v is CeremonyDetail {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    ("id" in o && (typeof o.id === "string" || typeof o.id === "number")) &&
    typeof o.title === "string" &&
    Array.isArray(o.participants)
  );
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

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CeremonyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [ceremony, setCeremony] = useState<CeremonyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // 参加者追加フォーム
  const [householderList, setHouseholderList] = useState<Householder[]>([]);
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [participantForm, setParticipantForm] = useState({
    householderId: "",
    attendees: "1",
    offering: "",
    note: "",
  });
  const [participantError, setParticipantError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cRes, hRes] = await Promise.all([
          fetchWithAuth(`/api/ceremonies/${id}`),
          fetchWithAuth("/api/householder?active=true"),
        ]);
        const ceremonyJson = await cRes.json();
        const householderJson = await hRes.json();
        const householders =
          hRes.ok && Array.isArray(householderJson) ? householderJson : [];
        if (cancelled) return;
        if (cRes.ok && isCeremonyDetail(ceremonyJson)) {
          setCeremony(ceremonyJson);
        } else {
          setCeremony(null);
        }
        setHouseholderList(householders);
      } catch {
        if (!cancelled) {
          setCeremony(null);
          setHouseholderList([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("この法要・行事を削除してもよろしいですか？")) return;
    setDeleting(true);
    try {
      await fetch(`/api/ceremonies/${id}`, { method: "DELETE" });
      router.push("/ceremonies");
    } catch {
      setDeleting(false);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setParticipantError("");
    try {
      const res = await fetchWithAuth(`/api/ceremonies/${id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(participantForm),
      });

      if (!res.ok) {
        const data = await res.json();
        setParticipantError(data.error || "追加に失敗しました");
        return;
      }

      // 再取得
      const uRes = await fetchWithAuth(`/api/ceremonies/${id}`);
      const updated = await uRes.json();
      if (uRes.ok && isCeremonyDetail(updated)) setCeremony(updated);
      setAddingParticipant(false);
      setParticipantForm({ householderId: "", attendees: "1", offering: "", note: "" });
    } catch (err) {
      console.error(err);
      setParticipantError("エラーが発生しました");
    }
  };

  const handleRemoveParticipant = async (householderId: number) => {
    if (!confirm("参加者を削除しますか？")) return;
    try {
      await fetch(`/api/ceremonies/${id}/participants?householderId=${householderId}`, {
        method: "DELETE",
      });
      const uRes = await fetchWithAuth(`/api/ceremonies/${id}`);
      const updated = await uRes.json();
      if (uRes.ok && isCeremonyDetail(updated)) setCeremony(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      const res = await fetchWithAuth(`/api/ceremonies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ceremony, status }),
      });
      const updated = await res.json();
      if (res.ok && isCeremonyDetail(updated)) setCeremony(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-12 text-stone-400">読み込み中...</div>;
  if (!ceremony) return <div className="text-center py-12 text-stone-400">法要が見つかりません</div>;

  const participants = ceremony.participants ?? [];
  const totalOffering = participants.reduce((sum, p) => sum + (p.offering || 0), 0);
  const totalAttendees = participants.reduce((sum, p) => sum + p.attendees, 0);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ceremonies" className="text-stone-400 hover:text-stone-600 text-sm">
          ← 一覧へ
        </Link>
        <h1 className="text-2xl font-bold text-amber-700">{ceremony.title}</h1>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            STATUS_COLORS[ceremony.status] || "bg-stone-100 text-stone-500"
          }`}
        >
          {STATUS_LABELS[ceremony.status] || ceremony.status}
        </span>
      </div>

      <div className="flex gap-3 flex-wrap justify-end">
        {ceremony.status === "SCHEDULED" && (
          <>
            <button
              onClick={() => updateStatus("COMPLETED")}
              className="border border-green-300 text-green-700 px-4 py-1.5 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
            >
              完了にする
            </button>
            <button
              onClick={() => updateStatus("CANCELLED")}
              className="border border-stone-300 text-stone-500 px-4 py-1.5 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium"
            >
              中止にする
            </button>
          </>
        )}
        {ceremony.status !== "SCHEDULED" && (
          <button
            onClick={() => updateStatus("SCHEDULED")}
            className="border border-blue-300 text-blue-700 px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            予定に戻す
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="border border-red-200 text-red-600 px-4 py-1.5 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {deleting ? "削除中..." : "削除"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-700 mb-4">基本情報</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-stone-400">種別</dt>
            <dd className="text-stone-700">{CEREMONY_TYPE_LABELS[ceremony.ceremonyType] || ceremony.ceremonyType}</dd>
          </div>
          <div>
            <dt className="text-stone-400">場所</dt>
            <dd className="text-stone-700">{ceremony.location || "-"}</dd>
          </div>
          <div>
            <dt className="text-stone-400">開催日時</dt>
            <dd className="text-stone-700">{formatDateTime(ceremony.scheduledAt)}</dd>
          </div>
          {ceremony.endAt && (
            <div>
              <dt className="text-stone-400">終了日時</dt>
              <dd className="text-stone-700">{formatDateTime(ceremony.endAt)}</dd>
            </div>
          )}
          {ceremony.maxAttendees && (
            <div>
              <dt className="text-stone-400">定員</dt>
              <dd className="text-stone-700">{ceremony.maxAttendees}名</dd>
            </div>
          )}
          {ceremony.fee && (
            <div>
              <dt className="text-stone-400">費用</dt>
              <dd className="text-stone-700">{ceremony.fee.toLocaleString()}円</dd>
            </div>
          )}
          {ceremony.description && (
            <div className="col-span-2">
              <dt className="text-stone-400">説明</dt>
              <dd className="text-stone-700 whitespace-pre-wrap">{ceremony.description}</dd>
            </div>
          )}
          {ceremony.note && (
            <div className="col-span-2">
              <dt className="text-stone-400">備考</dt>
              <dd className="text-stone-700 whitespace-pre-wrap">{ceremony.note}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-700">
            参加戸主 ({participants.length}件 / {totalAttendees}名)
          </h2>
          <div className="flex items-center gap-4">
            {totalOffering > 0 && (
              <span className="text-sm text-stone-500">
                御布施合計: {totalOffering.toLocaleString()}円
              </span>
            )}
            <button
              onClick={() => setAddingParticipant(!addingParticipant)}
              className="text-sm text-stone-600 hover:text-stone-800 border border-stone-300 px-3 py-1 rounded-lg"
            >
              + 参加者追加
            </button>
          </div>
        </div>

        {addingParticipant && (
          <form onSubmit={handleAddParticipant} className="border border-stone-200 rounded-lg p-4 mb-4 space-y-3">
            {participantError && (
              <div className="text-red-600 text-sm">{participantError}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm text-stone-500 mb-1">戸主 *</label>
                <select
                  value={participantForm.householderId}
                  onChange={(e) => setParticipantForm({ ...participantForm, householderId: e.target.value })}
                  required
                  className="w-full border border-stone-300 rounded px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
                >
                  <option value="">選択してください</option>
                  {householderList
                    .filter((h) => !participants.some((p) => String(p.householderId) === String(h.id)))
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.householderCode} - {h.familyName} {h.givenName}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-stone-500 mb-1">参加人数</label>
                <input
                  type="number"
                  value={participantForm.attendees}
                  onChange={(e) => setParticipantForm({ ...participantForm, attendees: e.target.value })}
                  min="1"
                  className="w-full border border-stone-300 rounded px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-500 mb-1">御布施（円）</label>
                <input
                  type="number"
                  value={participantForm.offering}
                  onChange={(e) => setParticipantForm({ ...participantForm, offering: e.target.value })}
                  min="0"
                  placeholder="金額"
                  className="w-full border border-stone-300 rounded px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-stone-700 text-white px-4 py-1.5 rounded-lg hover:bg-stone-800 text-sm font-medium"
              >
                追加
              </button>
              <button
                type="button"
                onClick={() => setAddingParticipant(false)}
                className="border border-stone-300 text-stone-600 px-4 py-1.5 rounded-lg hover:bg-stone-50 text-sm font-medium"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}

        {participants.length === 0 ? (
          <p className="text-stone-400 text-sm">参加者が登録されていません</p>
        ) : (
          <table className="w-full text-base">
            <thead className="border-b border-stone-200">
              <tr>
                <th className="text-left pb-2 text-stone-500 font-medium">戸主</th>
                <th className="text-right pb-2 text-stone-500 font-medium">人数</th>
                <th className="text-right pb-2 text-stone-500 font-medium">御布施</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {participants.map((p) => {
                const h = p.householder;
                if (!h) return null;
                return (
                <tr key={p.id}>
                  <td className="py-2">
                    <Link
                      href={`/householder/${p.householderId}`}
                      className="text-stone-800 hover:text-stone-600 hover:underline"
                    >
                      {h.familyName} {h.givenName}
                    </Link>
                    <span className="ml-2 text-xs text-stone-400">{h.householderCode}</span>
                  </td>
                  <td className="py-2 text-right text-stone-600">{p.attendees}名</td>
                  <td className="py-2 text-right text-stone-600">
                    {p.offering ? `${p.offering.toLocaleString()}円` : "-"}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => handleRemoveParticipant(p.householderId)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      削除
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
