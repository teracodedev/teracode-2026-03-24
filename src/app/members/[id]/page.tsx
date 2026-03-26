"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

interface MemberDetail {
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
    familyNameKana: string | null;
    givenNameKana: string | null;
    address1: string | null;
    address2: string | null;
    address3: string | null;
    phone1: string | null;
    phone2: string | null;
    email: string | null;
    isActive: boolean;
    familyRegister: { id: string; name: string } | null;
  };
}

// 数字を漢数字に変換
function toKanji(n: number): string {
  if (n === 0) return "〇";
  const digits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const units = ["", "十", "百", "千"];
  let result = "";
  const str = String(n);
  const len = str.length;
  for (let i = 0; i < len; i++) {
    const d = parseInt(str[i]);
    const unit = units[len - 1 - i];
    if (d === 0) continue;
    if (d === 1 && unit !== "") {
      result += unit;
    } else {
      result += digits[d] + unit;
    }
  }
  return result;
}

// 和暦に変換
function toWareki(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();

  let eraName: string;
  let eraYear: number;

  if (y > 2019 || (y === 2019 && m >= 5)) {
    eraName = "令和";
    eraYear = y - 2018;
  } else if (y > 1989 || (y === 1989 && m > 1) || (y === 1989 && m === 1 && day >= 8)) {
    eraName = "平成";
    eraYear = y - 1988;
  } else if (y > 1926 || (y === 1926 && m === 12 && day >= 25)) {
    eraName = "昭和";
    eraYear = y - 1925;
  } else if (y > 1912 || (y === 1912 && m >= 8)) {
    eraName = "大正";
    eraYear = y - 1911;
  } else {
    eraName = "明治";
    eraYear = y - 1867;
  }

  return `${eraName}${toKanji(eraYear)}年${toKanji(m)}月${toKanji(day)}日`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatDateWestern(dateStr: string): string {
  return formatDate(dateStr);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

function calcAgeAtDeath(birthDateStr: string | null, deathDateStr: string | null): string {
  if (!birthDateStr || !deathDateStr) return "-";
  const birth = new Date(birthDateStr);
  const death = new Date(deathDateStr);
  let age = death.getFullYear() - birth.getFullYear();
  const m = death.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) age--;
  return age + "才";
}

// 年回表データ
function getNenkai(deathDate: string): { label: string; years: number }[] {
  return [
    { label: "一周忌", years: 1 },
    { label: "三回忌", years: 2 },
    { label: "七回忌", years: 6 },
    { label: "十三回忌", years: 12 },
    { label: "十七回忌", years: 16 },
    { label: "二十五回忌", years: 24 },
    { label: "三十三回忌", years: 32 },
    { label: "五十回忌", years: 49 },
  ];
}

// 中陰表データ（命日を1日目として数える）
function getChuIn(): { label: string; days: number }[] {
  return [
    { label: "初七日忌", days: 6 },
    { label: "二七日忌", days: 13 },
    { label: "三七日忌", days: 20 },
    { label: "四七日忌", days: 27 },
    { label: "五七日忌", days: 34 },
    { label: "六七日忌", days: 41 },
    { label: "四十九日（七七日忌）", days: 48 },
  ];
}

// 直近の仏事を計算（四十九日忌 + 年回）
function getNextCeremony(deathDate: string): { label: string; date: string } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 四十九日忌のみチェック
  const shijukuDate = new Date(addDays(deathDate, 48));
  shijukuDate.setHours(0, 0, 0, 0);
  if (shijukuDate >= today) {
    return { label: "四十九日忌", date: addDays(deathDate, 48) };
  }

  // 年回チェック
  for (const nk of getNenkai(deathDate)) {
    const d = new Date(addYears(deathDate, nk.years));
    d.setHours(0, 0, 0, 0);
    if (d >= today) {
      return { label: nk.label, date: addYears(deathDate, nk.years) };
    }
  }

  return null;
}

function handleYamlExport(member: MemberDetail) {
  const data = {
    個人: {
      個人UUID: member.id,
      姓: member.familyName,
      名: member.givenName || null,
      姓フリガナ: member.familyNameKana || null,
      名フリガナ: member.givenNameKana || null,
      命日: member.deathDate ? new Date(member.deathDate).toISOString().split("T")[0] : null,
      法名: member.dharmaName || null,
      法名フリガナ: member.dharmaNameKana || null,
      続柄: member.relation || null,
      戸主名: `${member.householder.familyName}${member.householder.givenName}`,
      戸主UUID: member.householder.id,
      備考: member.note || null,
    },
  };
  const lines = Object.entries(data.個人).map(([k, v]) => `  ${k}: ${v === null ? "null" : JSON.stringify(v)}`);
  const yaml = `個人:\n${lines.join("\n")}\n`;
  const blob = new Blob([yaml], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${member.familyName}${member.givenName || ""}.yaml`;
  a.click();
  URL.revokeObjectURL(url);
}

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Googleカレンダー用テキスト
  const [ceremonyTime, setCeremonyTime] = useState("11:00");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  // 編集モーダル
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    familyName: "", givenName: "", familyNameKana: "", givenNameKana: "",
    dharmaName: "", dharmaNameKana: "",
    deathDate: "", birthDate: "",
    relation: "", note: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchWithAuth("/api/members/" + id)
      .then((res) => {
        if (!res.ok) { setNotFound(true); setLoading(false); return null; }
        return res.json();
      })
      .then((data) => {
        if (data) { setMember(data); setLoading(false); }
      })
      .catch(() => setLoading(false));
  }, [id]);

  function openEdit() {
    if (!member) return;
    setEditForm({
      familyName: member.familyName,
      givenName: member.givenName || "",
      familyNameKana: member.familyNameKana || "",
      givenNameKana: member.givenNameKana || "",
      dharmaName: member.dharmaName || "",
      dharmaNameKana: member.dharmaNameKana || "",
      deathDate: toDateInputValue(member.deathDate),
      birthDate: toDateInputValue(member.birthDate),
      relation: member.relation || "",
      note: member.note || "",
    });
    setSaveError(null);
    setIsEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetchWithAuth("/api/members/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyName: editForm.familyName,
          givenName: editForm.givenName || null,
          familyNameKana: editForm.familyNameKana || null,
          givenNameKana: editForm.givenNameKana || null,
          dharmaName: editForm.dharmaName || null,
          dharmaNameKana: editForm.dharmaNameKana || null,
          deathDate: editForm.deathDate || null,
          birthDate: editForm.birthDate || null,
          relation: editForm.relation || null,
          note: editForm.note || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setSaveError(err.error || "保存に失敗しました");
        return;
      }
      // 再取得して画面を更新
      const updated = await fetchWithAuth("/api/members/" + id);
      const data = await updated.json();
      setMember(data);
      setIsEditing(false);
    } catch {
      setSaveError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-stone-400">読み込み中...</div>;
  if (notFound || !member) return <div className="text-center py-12 text-stone-400">記録が見つかりません</div>;

  const isDeceased = !!member.deathDate;
  const fullName = member.familyName + (member.givenName ? " " + member.givenName : "");
  const fullNameKana = [member.familyNameKana, member.givenNameKana].filter(Boolean).join(" ") || null;

  if (!isDeceased) {
    // 生存者は簡易表示
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/genzaicho" className="text-stone-400 hover:text-stone-600 text-sm">← 現在帳一覧へ</Link>
          <h1 className="text-2xl font-bold text-stone-800">{fullName}</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div><dt className="text-stone-400 text-xs mb-0.5">氏名</dt><dd className="font-medium text-stone-800">{fullName}</dd></div>
            {member.relation && <div><dt className="text-stone-400 text-xs mb-0.5">続柄</dt><dd className="text-stone-700">{member.relation}</dd></div>}
          </dl>
        </div>
      </div>
    );
  }

  const nenkai = getNenkai(member.deathDate!);
  const chuIn = getChuIn();
  const nextCeremony = getNextCeremony(member.deathDate!);

  return (
    <div className="max-w-3xl space-y-5">
      {/* 上部ボタン */}
      <div className="flex gap-2 flex-wrap">
        {member.householder.familyRegister ? (
          <Link
            href={`/family-register/${member.householder.familyRegister.id}`}
            className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded border border-stone-300"
          >
            所属する家族台帳に戻る
          </Link>
        ) : (
          <Link
            href={`/householder/${member.householder.id}`}
            className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded border border-stone-300"
          >
            所属する戸主台帳に戻る
          </Link>
        )}
        <Link
          href="/kakocho"
          className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded border border-stone-300"
        >
          過去帳（物故者リスト）と戻る
        </Link>
      </div>

      {/* タイトル */}
      <h1 className="text-2xl font-bold text-stone-800">過去帳: {fullName}</h1>

      {/* 直近の仏事 */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
        <h2 className="font-semibold text-stone-700 mb-3 text-sm">直近の仏事</h2>
        {nextCeremony ? (() => {
          const householderName = member.householder.familyName + member.householder.givenName;
          const rel = member.relation || "";
          const relationPart = rel
            ? ` （${rel.startsWith(householderName) ? rel : `${householderName}の${rel}`}）`
            : "";
          const ceremonyLabel = `${fullName}の${nextCeremony.label}`;
          const addr = [member.householder.address1, member.householder.address2, member.householder.address3].filter(Boolean).join("");
          const phone = member.householder.phone1 || "";
          const homeText = `<至法>${ceremonyTime} ${householderName}${relationPart} ${ceremonyLabel}＠自宅［${addr}、、${phone}］ 至法受付`;
          const templeText = `<至法>${ceremonyTime} ${householderName}${relationPart} ${ceremonyLabel}＠善法寺本堂 名 至法受付`;
          return (
            <div className="space-y-4">
              <p className="text-sm text-red-600 font-medium">
                {fullName}の<span className="font-semibold">{nextCeremony.label}</span>：
                {formatDateWestern(nextCeremony.date)}（{toWareki(nextCeremony.date)}）
              </p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-stone-500 whitespace-nowrap">受付時間</label>
                <input
                  type="time"
                  value={ceremonyTime}
                  onChange={e => setCeremonyTime(e.target.value)}
                  className="border border-stone-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>
              {[
                { id: "home", label: "ご自宅の場合", text: homeText },
                { id: "temple", label: "お寺参りの場合", text: templeText },
              ].map(({ id, label, text }) => (
                <div key={id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-600">{label}</span>
                    <button
                      onClick={() => copyText(text, id)}
                      className="text-xs px-2.5 py-0.5 border border-stone-300 rounded hover:bg-stone-100 text-stone-600 transition-colors"
                    >
                      {copiedId === id ? "✓ コピー済" : "コピー"}
                    </button>
                  </div>
                  <pre
                    className="text-xs bg-stone-50 border border-stone-200 rounded p-2 whitespace-pre-wrap break-all font-mono select-all leading-relaxed cursor-text"
                    onClick={() => copyText(text, id)}
                    title="クリックでコピー"
                  >
                    {text}
                  </pre>
                </div>
              ))}
            </div>
          );
        })() : (
          <p className="text-sm text-stone-400">直近の仏事はありません</p>
        )}
      </div>

      {/* ダウンロード */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
        <h2 className="font-semibold text-stone-700 mb-3 text-sm">ダウンロード</h2>
        {(() => {
          // 法名の文字数でテンプレートを自動選択（6文字→院号法名、それ以外→法名）
          const dharmaLen = member.dharmaName?.length ?? 0;
          const isIngo = dharmaLen === 6;
          const labelMap: Record<string, string> = {
            sogi: "葬儀法名",
            "sogi-ingo": "葬儀院号法名",
            nenkai: "年回法名",
            "nenkai-ingo": "年回院号法名",
            chuin: "中陰表・年回表",
            "chuin-ingo": "中陰表・年回表（院号法名）",
            noukansoungou: "納棺尊号",
          };
          const buttons = [
            { label: "葬儀法名", type: isIngo ? "sogi-ingo" : "sogi" },
            { label: "年回法名", type: isIngo ? "nenkai-ingo" : "nenkai" },
            { label: "中陰表・年回表", type: isIngo ? "chuin-ingo" : "chuin" },
            { label: "納棺尊号", type: "noukansoungou" },
          ];

          async function handleDownload(type: string) {
            try {
              if (!member) {
                alert("会員情報の取得後に再度お試しください");
                return;
              }
              const res = await fetchWithAuth(`/api/members/${id}/document/${type}`);
              if (!res.ok) {
                alert("ダウンロードに失敗しました");
                return;
              }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              const name = member!.familyName + (member!.givenName || "");
              const docLabel = labelMap[type] ?? type;
              a.download = type === "noukansoungou"
                ? "納棺尊号.docx"
                : `${name}_${docLabel}.docx`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } catch {
              alert("ダウンロードに失敗しました");
            }
          }

          return (
            <div className="space-y-2">
              {isIngo && (
                <p className="text-xs text-stone-400">法名が6文字のため、院号法名テンプレートを使用します</p>
              )}
              <div className="flex flex-wrap gap-2">
                {buttons.map(({ label, type }) => (
                  <button
                    key={type}
                    onClick={() => handleDownload(type)}
                    className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded border border-stone-300 cursor-pointer"
                  >
                    ⬇ {label}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 基本情報 */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-semibold text-stone-700 text-sm">基本情報</h2>
          <button
            onClick={openEdit}
            className="text-xs px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            編集
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-3 py-2 text-stone-500 font-medium text-xs whitespace-nowrap">氏名</th>
                <th className="text-left px-3 py-2 text-stone-500 font-medium text-xs whitespace-nowrap">フリガナ</th>
                <th className="text-left px-3 py-2 text-stone-500 font-medium text-xs whitespace-nowrap">法名</th>
                <th className="text-left px-3 py-2 text-stone-500 font-medium text-xs whitespace-nowrap">法名フリガナ</th>
                <th className="text-left px-3 py-2 text-stone-500 font-medium text-xs whitespace-nowrap">命日（西暦）</th>
                <th className="text-left px-3 py-2 text-stone-500 font-medium text-xs whitespace-nowrap">命日（和暦）</th>
                <th className="text-left px-3 py-2 text-stone-500 font-medium text-xs whitespace-nowrap">享年</th>
                <th className="text-left px-3 py-2 text-stone-500 font-medium text-xs whitespace-nowrap">続柄</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 font-medium text-stone-800 whitespace-nowrap">{fullName}</td>
                <td className="px-3 py-2 text-stone-600 whitespace-nowrap">{fullNameKana || "-"}</td>
                <td className="px-3 py-2 text-stone-600 whitespace-nowrap">{member.dharmaName || "-"}</td>
                <td className="px-3 py-2 text-stone-600 whitespace-nowrap">{member.dharmaNameKana || "-"}</td>
                <td className="px-3 py-2 text-stone-600 whitespace-nowrap">
                  <span className="text-amber-700 hover:underline cursor-default">{formatDate(member.deathDate)}</span>
                </td>
                <td className="px-3 py-2 text-stone-600 whitespace-nowrap">
                  <span className="text-amber-700 hover:underline cursor-default">{toWareki(member.deathDate)}</span>
                </td>
                <td className="px-3 py-2 text-stone-600 whitespace-nowrap">{calcAgeAtDeath(member.birthDate, member.deathDate)}</td>
                <td className="px-3 py-2 text-stone-600 whitespace-nowrap">{member.relation || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 年回表 */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200">
          <h2 className="font-semibold text-stone-700 text-sm">年回表</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-2 text-stone-500 font-medium text-xs">年回</th>
                <th className="text-left px-4 py-2 text-stone-500 font-medium text-xs">年月日（西暦）</th>
                <th className="text-left px-4 py-2 text-stone-500 font-medium text-xs">年月日（和暦）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {nenkai.map(({ label, years }) => {
                const dateStr = addYears(member.deathDate!, years);
                return (
                  <tr key={label} className="hover:bg-stone-50">
                    <td className="px-4 py-2 text-stone-700">{label}</td>
                    <td className="px-4 py-2">
                      <span className="text-amber-700 hover:underline cursor-default">{formatDateWestern(dateStr)}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-amber-700 hover:underline cursor-default">{toWareki(dateStr)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 中陰表 */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200">
          <h2 className="font-semibold text-stone-700 text-sm">中陰表</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-2 text-stone-500 font-medium text-xs">中陰</th>
                <th className="text-left px-4 py-2 text-stone-500 font-medium text-xs">年月日（西暦）</th>
                <th className="text-left px-4 py-2 text-stone-500 font-medium text-xs">年月日（和暦）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {chuIn.map(({ label, days }) => {
                const dateStr = addDays(member.deathDate!, days);
                return (
                  <tr key={label} className="hover:bg-stone-50">
                    <td className="px-4 py-2 text-stone-700">{label}</td>
                    <td className="px-4 py-2">
                      <span className="text-amber-700 hover:underline cursor-default">{formatDateWestern(dateStr)}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-amber-700 hover:underline cursor-default">{toWareki(dateStr)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* YAMLエクスポート */}
      <div className="pb-4">
        <button
          onClick={() => handleYamlExport(member)}
          className="text-sm px-4 py-2 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded-lg"
        >
          YAMLファイルのエクスポート
        </button>
      </div>

      {/* 編集モーダル */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <h2 className="font-semibold text-stone-800">過去帳情報を編集</h2>
              <button onClick={() => setIsEditing(false)} className="text-stone-400 hover:text-stone-600 text-xl leading-none">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-500 mb-1">姓 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editForm.familyName}
                    onChange={e => setEditForm(f => ({ ...f, familyName: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">名</label>
                  <input
                    type="text"
                    value={editForm.givenName}
                    onChange={e => setEditForm(f => ({ ...f, givenName: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">姓フリガナ</label>
                  <input
                    type="text"
                    value={editForm.familyNameKana}
                    onChange={e => setEditForm(f => ({ ...f, familyNameKana: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">名フリガナ</label>
                  <input
                    type="text"
                    value={editForm.givenNameKana}
                    onChange={e => setEditForm(f => ({ ...f, givenNameKana: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">法名</label>
                  <input
                    type="text"
                    value={editForm.dharmaName}
                    onChange={e => setEditForm(f => ({ ...f, dharmaName: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">法名フリガナ</label>
                  <input
                    type="text"
                    value={editForm.dharmaNameKana}
                    onChange={e => setEditForm(f => ({ ...f, dharmaNameKana: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">命日</label>
                  <input
                    type="date"
                    value={editForm.deathDate}
                    onChange={e => setEditForm(f => ({ ...f, deathDate: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">生年月日（享年計算用）</label>
                  <input
                    type="date"
                    value={editForm.birthDate}
                    onChange={e => setEditForm(f => ({ ...f, birthDate: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">続柄</label>
                <input
                  type="text"
                  value={editForm.relation}
                  onChange={e => setEditForm(f => ({ ...f, relation: e.target.value }))}
                  className="w-full border border-stone-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">備考</label>
                <textarea
                  value={editForm.note}
                  onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
                  rows={3}
                  className="w-full border border-stone-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-stone-200 flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="px-4 py-2 text-sm border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-40"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.familyName}
                className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-40"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
