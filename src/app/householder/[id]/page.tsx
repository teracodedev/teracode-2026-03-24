"use client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  familyName: string;
  givenName: string | null;
  familyNameKana: string | null;
  givenNameKana: string | null;
  relation: string | null;
  postalCode: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  phone1: string | null;
  phone2: string | null;
  fax: string | null;
  domicile: string | null;
  birthDate: string | null;
  deathDate: string | null;
  dharmaName: string | null;
  dharmaNameKana: string | null;
  note: string | null;
}

interface Ceremony {
  id: string;
  title: string;
  scheduledAt: string;
  ceremonyType: string;
}

interface HouseholderDetail {
  id: string;
  householderCode: string;
  familyName: string;
  givenName: string;
  familyNameKana: string | null;
  givenNameKana: string | null;
  postalCode: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  phone1: string | null;
  phone2: string | null;
  fax: string | null;
  email: string | null;
  domicile: string | null;
  note: string | null;
  joinedAt: string | null;
  leftAt: string | null;
  isActive: boolean;
  members: Member[];
  ceremonies: { ceremony: Ceremony }[];
}

type ContactForm = {
  postalCode: string;
  address1: string;
  address2: string;
  address3: string;
  phone1: string;
  phone2: string;
  fax: string;
  domicile: string;
  note: string;
};

const CEREMONY_TYPE_LABELS: Record<string, string> = {
  MEMORIAL: "法要",
  REGULAR: "定例行事",
  FUNERAL: "葬儀・告別式",
  SPECIAL: "特別行事",
  OTHER: "その他",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

function toInputDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

const emptyMemberForm = {
  familyName: "", givenName: "", familyNameKana: "", givenNameKana: "",
  relation: "",
  postalCode: "", address1: "", address2: "", address3: "",
  phone1: "", phone2: "", fax: "", domicile: "",
  birthDate: "", deathDate: "", dharmaName: "", dharmaNameKana: "", note: "",
};

type MemberForm = typeof emptyMemberForm;
type TabId = "info" | "detail" | "genzaicho" | "kakucho";

function MemberFormFields({ form, onChange }: { form: MemberForm; onChange: (f: MemberForm) => void }) {
  const set = (k: keyof MemberForm, v: string) => onChange({ ...form, [k]: v });
  const cls = "w-full border border-stone-300 rounded px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-stone-400";
  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      <div>
        <label className="block text-sm text-stone-500 mb-1">姓 <span className="text-red-500">*</span></label>
        <input type="text" value={form.familyName} onChange={(e) => set("familyName", e.target.value)} placeholder="山田" className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">名</label>
        <input type="text" value={form.givenName} onChange={(e) => set("givenName", e.target.value)} placeholder="花子" className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">姓（カナ）</label>
        <input type="text" value={form.familyNameKana} onChange={(e) => set("familyNameKana", e.target.value)} placeholder="ヤマダ" className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">名（カナ）</label>
        <input type="text" value={form.givenNameKana} onChange={(e) => set("givenNameKana", e.target.value)} placeholder="ハナコ" className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">続柄</label>
        <input type="text" value={form.relation} onChange={(e) => set("relation", e.target.value)} placeholder="妻・子など" className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">郵便番号</label>
        <input type="text" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="123-4567" className={cls} />
      </div>
      <div className="col-span-2">
        <label className="block text-sm text-stone-500 mb-1">住所1（都道府県・市区町村）</label>
        <input type="text" value={form.address1} onChange={(e) => set("address1", e.target.value)} placeholder="東京都渋谷区" className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">住所2（丁目・番地）</label>
        <input type="text" value={form.address2} onChange={(e) => set("address2", e.target.value)} className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">住所3（建物名等）</label>
        <input type="text" value={form.address3} onChange={(e) => set("address3", e.target.value)} className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">電話番号1</label>
        <input type="tel" value={form.phone1} onChange={(e) => set("phone1", e.target.value)} className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">電話番号2</label>
        <input type="tel" value={form.phone2} onChange={(e) => set("phone2", e.target.value)} className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">FAX</label>
        <input type="tel" value={form.fax} onChange={(e) => set("fax", e.target.value)} className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">本籍地</label>
        <input type="text" value={form.domicile} onChange={(e) => set("domicile", e.target.value)} className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">法名</label>
        <input type="text" value={form.dharmaName} onChange={(e) => set("dharmaName", e.target.value)} className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">法名（カナ）</label>
        <input type="text" value={form.dharmaNameKana} onChange={(e) => set("dharmaNameKana", e.target.value)} className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">生年月日</label>
        <input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} className={cls} />
      </div>
      <div>
        <label className="block text-sm text-stone-500 mb-1">命日</label>
        <input type="date" value={form.deathDate} onChange={(e) => set("deathDate", e.target.value)} className={cls} />
      </div>
      <div className="col-span-2">
        <label className="block text-sm text-stone-500 mb-1">備考</label>
        <input type="text" value={form.note} onChange={(e) => set("note", e.target.value)} className={cls} />
      </div>
    </div>
  );
}

function MemberCard({
  member, isEditing, editForm, editError, editSubmitting,
  onStartEdit, onCancelEdit, onEditChange, onEditSubmit, onDelete,
}: {
  member: Member;
  isEditing: boolean;
  editForm: MemberForm;
  editError: string;
  editSubmitting: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditChange: (f: MemberForm) => void;
  onEditSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
}) {
  const displayName = [member.familyName, member.givenName].filter(Boolean).join(" ");
  const displayKana = [member.familyNameKana, member.givenNameKana].filter(Boolean).join(" ");

  return (
    <div className="border border-stone-100 rounded-lg p-4 text-sm">
      {isEditing ? (
        <form onSubmit={onEditSubmit}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-stone-700">編集中</p>
            <button type="button" onClick={onCancelEdit}
              className="text-xs text-stone-400 hover:text-stone-600">キャンセル</button>
          </div>
          {editError && <p className="text-red-600 text-xs mt-1">{editError}</p>}
          <MemberFormFields form={editForm} onChange={onEditChange} />
          <div className="flex gap-2 mt-3">
            <button type="submit" disabled={editSubmitting}
              className="bg-stone-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-stone-800 disabled:opacity-50">
              {editSubmitting ? "保存中..." : "保存する"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div>
                <span className="font-medium text-stone-800">{displayName}</span>
                {displayKana && <div className="text-xs text-stone-400">{displayKana}</div>}
              </div>
              {member.relation && (
                <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{member.relation}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={onStartEdit}
                className="text-xs text-stone-500 hover:text-stone-700 border border-stone-200 px-2 py-0.5 rounded">
                編集
              </button>
              <button onClick={onDelete}
                className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-2 py-0.5 rounded">
                削除
              </button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-stone-500">
            <div className="col-span-2"><dt className="inline">UUID: </dt><dd className="inline font-mono break-all">{member.id}</dd></div>
            {member.relation && <div><dt className="inline">続柄: </dt><dd className="inline">{member.relation}</dd></div>}
            {member.birthDate && <div><dt className="inline">生年月日: </dt><dd className="inline">{formatDate(member.birthDate)}</dd></div>}
            {member.deathDate && <div><dt className="inline">命日: </dt><dd className="inline">{formatDate(member.deathDate)}</dd></div>}
            {member.dharmaName && <div><dt className="inline">法名: </dt><dd className="inline">{member.dharmaName}</dd></div>}
            {member.dharmaNameKana && <div><dt className="inline">法名（カナ）: </dt><dd className="inline">{member.dharmaNameKana}</dd></div>}
          </dl>
        </>
      )}
    </div>
  );
}

export default function HouseholderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [householder, setHouseholder] = useState<HouseholderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<MemberForm>(emptyMemberForm);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MemberForm>(emptyMemberForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null); // member.id を流用してどの行で戸主編集中かを管理
  const [contactForm, setContactForm] = useState<ContactForm>({
    postalCode: "", address1: "", address2: "", address3: "",
    phone1: "", phone2: "", fax: "", domicile: "", note: "",
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState("");

  const fetchHouseholder = () => {
    fetch(`/api/householder/${id}`)
      .then(async (res) => {
        const data = await res.json();
        const ok =
          res.ok &&
          data &&
          typeof data === "object" &&
          typeof (data as HouseholderDetail).id === "string" &&
          typeof (data as HouseholderDetail).familyName === "string" &&
          typeof (data as HouseholderDetail).givenName === "string";
        if (ok) {
          setHouseholder({
            ...(data as HouseholderDetail),
            members: Array.isArray(data.members) ? data.members : [],
            ceremonies: Array.isArray(data.ceremonies) ? data.ceremonies : [],
          });
        } else {
          setHouseholder(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setHouseholder(null);
        setLoading(false);
      });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchHouseholder(); }, [id]);

  const handleDelete = async () => {
    if (!confirm("この戸主を削除してもよろしいですか？")) return;
    setDeleting(true);
    try {
      await fetch(`/api/householder/${id}`, { method: "DELETE" });
      router.push("/householder");
    } catch { setDeleting(false); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSubmitting(true);
    setAddError("");
    try {
      const res = await fetchWithAuth(`/api/householder/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || "登録に失敗しました"); return; }
      setAddForm(emptyMemberForm);
      setShowAddForm(false);
      fetchHouseholder();
    } catch { setAddError("ネットワークエラーが発生しました"); }
    finally { setAddSubmitting(false); }
  };

  const startEdit = (member: Member) => {
    setEditingMemberId(member.id);
    setEditForm({
      familyName: member.familyName,
      givenName: member.givenName || "",
      familyNameKana: member.familyNameKana || "",
      givenNameKana: member.givenNameKana || "",
      relation: member.relation || "",
      postalCode: member.postalCode || "",
      address1: member.address1 || "",
      address2: member.address2 || "",
      address3: member.address3 || "",
      phone1: member.phone1 || "",
      phone2: member.phone2 || "",
      fax: member.fax || "",
      domicile: member.domicile || "",
      birthDate: toInputDate(member.birthDate),
      deathDate: toInputDate(member.deathDate),
      dharmaName: member.dharmaName || "",
      dharmaNameKana: member.dharmaNameKana || "",
      note: member.note || "",
    });
    setEditError("");
  };

  const handleEditMember = async (e: React.FormEvent, memberId: string) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError("");
    try {
      const res = await fetchWithAuth(`/api/householder/${id}/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || "更新に失敗しました"); return; }
      setEditingMemberId(null);
      fetchHouseholder();
    } catch { setEditError("ネットワークエラーが発生しました"); }
    finally { setEditSubmitting(false); }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`「${memberName}」を削除してもよろしいですか？`)) return;
    try {
      await fetch(`/api/householder/${id}/members/${memberId}`, { method: "DELETE" });
      fetchHouseholder();
    } catch { alert("削除に失敗しました"); }
  };

  const handleTransfer = async (memberId: string, memberName: string) => {
    if (!confirm(`「${memberName}」を新しい戸主にしますか？\n現在の戸主は世帯員（元戸主）に移ります。`)) return;
    setTransferring(true);
    try {
      const res = await fetchWithAuth(`/api/householder/${id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "当主交代に失敗しました"); return; }
      router.push(`/householder/${data.id}`);
    } catch { alert("ネットワークエラーが発生しました"); }
    finally { setTransferring(false); }
  };

  const startEditContact = () => {
    if (!householder) return;
    setContactForm({
      postalCode: householder.postalCode || "",
      address1: householder.address1 || "",
      address2: householder.address2 || "",
      address3: householder.address3 || "",
      phone1: householder.phone1 || "",
      phone2: householder.phone2 || "",
      fax: householder.fax || "",
      domicile: householder.domicile || "",
      note: householder.note || "",
    });
    setEditingContact("open");
    setContactError("");
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactError("");
    try {
      const res = await fetchWithAuth(`/api/householder/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyName: householder!.familyName,
          givenName: householder!.givenName,
          familyNameKana: householder!.familyNameKana,
          givenNameKana: householder!.givenNameKana,
          email: householder!.email,
          joinedAt: householder!.joinedAt,
          leftAt: householder!.leftAt,
          isActive: householder!.isActive,
          ...contactForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setContactError(data.error || "更新に失敗しました"); return; }
      setEditingContact(null);
      fetchHouseholder();
    } catch { setContactError("ネットワークエラーが発生しました"); }
    finally { setContactSubmitting(false); }
  };

  if (loading) return <div className="text-center py-12 text-stone-400">読み込み中...</div>;
  if (!householder) return <div className="text-center py-12 text-stone-400">戸主が見つかりません</div>;

  const members = householder.members ?? [];
  const livingMembers = members.filter((m) => !m.deathDate);
  const deceasedMembers = members.filter((m) => !!m.deathDate);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "info", label: "基本情報" },
    { id: "detail", label: "戸主詳細" },
    { id: "genzaicho", label: "現在帳", count: livingMembers.length },
    { id: "kakucho", label: "過去帳", count: deceasedMembers.length },
  ];

  return (
    <div className="max-w-3xl space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/householder" className="text-stone-400 hover:text-stone-600 text-sm">← 一覧へ</Link>
        <h1 className="text-2xl font-bold text-stone-500">{householder.familyName} {householder.givenName}</h1>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${householder.isActive ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
          {householder.isActive ? "在籍" : "離檀"}
        </span>
      </div>

      <div className="flex gap-3 justify-end flex-wrap">
        <a href={`/api/householder/${id}/export`}
          className="border border-stone-300 text-stone-600 px-4 py-1.5 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium">
          ⬇ エクスポート
        </a>
        <Link href={`/householder/${id}/edit`}
          className="border border-stone-300 text-stone-600 px-4 py-1.5 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium">
          編集
        </Link>
        <button onClick={handleDelete} disabled={deleting}
          className="border border-red-200 text-red-600 px-4 py-1.5 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50">
          {deleting ? "削除中..." : "削除"}
        </button>
      </div>

      {/* タブ */}
      <div className="border-b border-stone-200 overflow-x-auto">
        <nav className="flex gap-0 min-w-max" aria-label="タブ">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setShowAddForm(false);
                setEditingMemberId(null);
              }}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-amber-600 text-amber-700"
                  : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* 基本情報タブ */}
      {activeTab === "info" && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><dt className="text-stone-400">UUID</dt><dd className="font-mono text-stone-700 text-xs break-all">{householder.householderCode}</dd></div>
            <div>
              <dt className="text-stone-400">氏名（カナ）</dt>
              <dd className="text-stone-700">
                {[householder.familyNameKana, householder.givenNameKana].filter(Boolean).join(" ") || "-"}
              </dd>
            </div>
            <div><dt className="text-stone-400">郵便番号</dt><dd className="text-stone-700">{householder.postalCode || "-"}</dd></div>
            <div className="col-span-2">
              <dt className="text-stone-400">住所</dt>
              <dd className="text-stone-700">
                {[householder.address1, householder.address2, householder.address3].filter(Boolean).join(" ") || "-"}
              </dd>
            </div>
            <div><dt className="text-stone-400">電話番号1</dt><dd className="text-stone-700">{householder.phone1 || "-"}</dd></div>
            <div><dt className="text-stone-400">電話番号2</dt><dd className="text-stone-700">{householder.phone2 || "-"}</dd></div>
            <div><dt className="text-stone-400">メールアドレス</dt><dd className="text-stone-700">{householder.email || "-"}</dd></div>
            <div><dt className="text-stone-400">入檀日</dt><dd className="text-stone-700">{formatDate(householder.joinedAt)}</dd></div>
            {householder.leftAt && (
              <div><dt className="text-stone-400">離檀日</dt><dd className="text-stone-700">{formatDate(householder.leftAt)}</dd></div>
            )}
            {householder.note && (
              <div className="col-span-2">
                <dt className="text-stone-400">備考</dt>
                <dd className="text-stone-700 whitespace-pre-wrap">{householder.note}</dd>
              </div>
            )}
          </dl>

          {/* 参加法要履歴 */}
          {(householder.ceremonies ?? []).filter((row) => row?.ceremony?.id).length > 0 && (
            <div className="mt-6 pt-6 border-t border-stone-100">
              <h3 className="font-medium text-stone-600 mb-3 text-sm">参加法要履歴</h3>
              <div className="space-y-2">
                {(householder.ceremonies ?? [])
                  .filter((row): row is { ceremony: Ceremony } => !!row?.ceremony?.id)
                  .map(({ ceremony }) => (
                  <Link key={ceremony.id} href={`/ceremonies/${ceremony.id}`}
                    className="flex items-center justify-between border border-stone-100 rounded-lg p-3 hover:bg-stone-50">
                    <div>
                      <span className="text-sm font-medium text-stone-800">{ceremony.title}</span>
                      <span className="ml-2 text-xs text-stone-400">
                        {CEREMONY_TYPE_LABELS[ceremony.ceremonyType] || ceremony.ceremonyType}
                      </span>
                    </div>
                    <span className="text-xs text-stone-400">{formatDate(ceremony.scheduledAt)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 戸主詳細タブ */}
      {activeTab === "detail" && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="col-span-2">
              <dt className="text-stone-400 mb-1">本籍地</dt>
              <dd className="text-stone-700">{householder.domicile || "-"}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* 現在帳タブ */}
      {activeTab === "genzaicho" && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-400">存命の世帯員</p>
            <button
              onClick={() => { setShowAddForm(!showAddForm); setAddError(""); setAddForm(emptyMemberForm); }}
              className="text-sm text-stone-600 hover:text-stone-800 border border-stone-300 px-3 py-1 rounded-lg"
            >
              {showAddForm ? "キャンセル" : "+ 追加"}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddMember} className="border border-stone-200 rounded-lg p-4 mb-4 bg-stone-50">
              <p className="text-sm font-medium text-stone-700">新規世帯員</p>
              {addError && <p className="text-red-600 text-xs mt-1">{addError}</p>}
              <MemberFormFields form={addForm} onChange={setAddForm} />
              <div className="flex gap-2 mt-3">
                <button type="submit" disabled={addSubmitting}
                  className="bg-stone-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-stone-800 disabled:opacity-50">
                  {addSubmitting ? "登録中..." : "登録する"}
                </button>
              </div>
            </form>
          )}

          {livingMembers.length === 0 && !showAddForm ? (
            <p className="text-stone-400 text-sm">存命の世帯員が登録されていません</p>
          ) : (
            <div className="space-y-2">
              {livingMembers.map((member) => {
                const isEditing = editingMemberId === member.id;
                const isExpanded = expandedDetailId === member.id;
                const displayName = [member.familyName, member.givenName].filter(Boolean).join(" ");
                return (
                  <div key={member.id} className="border border-stone-200 rounded-lg overflow-hidden">
                    {/* 行ヘッダー */}
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-white">
                      <button
                        onClick={() => setExpandedDetailId(isExpanded ? null : member.id)}
                        className="shrink-0 border border-stone-300 rounded px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 transition-colors font-medium"
                      >
                        {isExpanded ? "▲" : "詳細"}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-stone-800">{displayName}</span>
                        {member.relation && (
                          <span className="ml-2 text-sm text-stone-400">{member.relation}</span>
                        )}
                        {member.birthDate && (
                          <span className="ml-2 text-sm text-stone-400">{formatDate(member.birthDate)}</span>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleTransfer(member.id, displayName)}
                          disabled={transferring}
                          className="text-xs text-amber-600 hover:text-amber-800 border border-amber-200 px-2 py-1 rounded disabled:opacity-50">
                          当主交代
                        </button>
                        <button onClick={() => { startEdit(member); setExpandedDetailId(null); }}
                          className="text-xs text-stone-500 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded">
                          編集
                        </button>
                        <button onClick={() => handleDeleteMember(member.id, displayName)}
                          className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-2 py-1 rounded">
                          削除
                        </button>
                      </div>
                    </div>

                    {/* 詳細パネル */}
                    {isExpanded && !isEditing && (
                      <div className="bg-stone-50 border-t border-stone-200 px-4 py-4 space-y-4">

                        {/* 世帯員情報 */}
                        <div>
                          <p className="text-xs font-semibold text-stone-400 uppercase mb-2">世帯員情報</p>
                          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-stone-700">
                            {member.familyNameKana && (
                              <div className="col-span-2">
                                <dt className="inline text-stone-400">カナ: </dt>
                                <dd className="inline">{member.familyNameKana} {member.givenNameKana || ""}</dd>
                              </div>
                            )}
                            {member.relation && (
                              <div><dt className="inline text-stone-400">続柄: </dt><dd className="inline">{member.relation}</dd></div>
                            )}
                            {member.birthDate && (
                              <div><dt className="inline text-stone-400">生年月日: </dt><dd className="inline">{formatDate(member.birthDate)}</dd></div>
                            )}
                            {member.dharmaName && (
                              <div><dt className="inline text-stone-400">法名: </dt><dd className="inline">{member.dharmaName}</dd></div>
                            )}
                            {member.dharmaNameKana && (
                              <div><dt className="inline text-stone-400">法名（カナ）: </dt><dd className="inline">{member.dharmaNameKana}</dd></div>
                            )}
                            {member.note && (
                              <div className="col-span-2"><dt className="inline text-stone-400">備考: </dt><dd className="inline">{member.note}</dd></div>
                            )}
                          </dl>
                        </div>

                        {/* 個人連絡先 */}
                        <div className="border-t border-stone-200 pt-3">
                          <p className="text-xs font-semibold text-stone-400 uppercase mb-2">連絡先</p>
                          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-stone-700">
                            <div><dt className="inline text-stone-400">郵便番号: </dt><dd className="inline">{member.postalCode || "-"}</dd></div>
                            <div className="col-span-2"><dt className="inline text-stone-400">住所1: </dt><dd className="inline">{member.address1 || "-"}</dd></div>
                            {member.address2 && <div className="col-span-2"><dt className="inline text-stone-400">住所2: </dt><dd className="inline">{member.address2}</dd></div>}
                            {member.address3 && <div className="col-span-2"><dt className="inline text-stone-400">住所3: </dt><dd className="inline">{member.address3}</dd></div>}
                            <div><dt className="inline text-stone-400">電話番号1: </dt><dd className="inline">{member.phone1 || "-"}</dd></div>
                            <div><dt className="inline text-stone-400">電話番号2: </dt><dd className="inline">{member.phone2 || "-"}</dd></div>
                            <div><dt className="inline text-stone-400">FAX: </dt><dd className="inline">{member.fax || "-"}</dd></div>
                            {member.domicile && <div className="col-span-2"><dt className="inline text-stone-400">本籍地: </dt><dd className="inline">{member.domicile}</dd></div>}
                          </dl>
                        </div>
                      </div>
                    )}

                    {/* 編集フォーム */}
                    {isEditing && (
                      <div className="border-t border-stone-200 p-4 bg-stone-50">
                        <form onSubmit={(e) => handleEditMember(e, member.id)}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-stone-700">編集中</p>
                            <button type="button" onClick={() => setEditingMemberId(null)}
                              className="text-xs text-stone-400 hover:text-stone-600">キャンセル</button>
                          </div>
                          {editError && <p className="text-red-600 text-xs mb-2">{editError}</p>}
                          <MemberFormFields form={editForm} onChange={setEditForm} />
                          <div className="flex gap-2 mt-3">
                            <button type="submit" disabled={editSubmitting}
                              className="bg-stone-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-stone-800 disabled:opacity-50">
                              {editSubmitting ? "保存中..." : "保存する"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 過去帳タブ */}
      {activeTab === "kakucho" && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <p className="text-sm text-stone-400 mb-4">故人の世帯員</p>

          {deceasedMembers.length === 0 ? (
            <p className="text-stone-400 text-sm">故人の世帯員が登録されていません</p>
          ) : (
            <div className="space-y-3">
              {deceasedMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isEditing={editingMemberId === member.id}
                  editForm={editForm}
                  editError={editError}
                  editSubmitting={editSubmitting}
                  onStartEdit={() => startEdit(member)}
                  onCancelEdit={() => setEditingMemberId(null)}
                  onEditChange={setEditForm}
                  onEditSubmit={(e) => handleEditMember(e, member.id)}
                  onDelete={() => handleDeleteMember(member.id, [member.familyName, member.givenName].filter(Boolean).join(" "))}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
