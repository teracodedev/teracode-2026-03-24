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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
}

function calcAge(birthDateStr: string | null): string {
  if (!birthDateStr) return "-";
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age + "歳";
}

function joinAddress(h: { address1: string | null; address2: string | null; address3: string | null }): string {
  return [h.address1, h.address2, h.address3].filter(Boolean).join(" ") || "-";
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  if (loading) return <div className="text-center py-12 text-stone-400">読み込み中...</div>;
  if (notFound || !member) return <div className="text-center py-12 text-stone-400">記録が見つかりません</div>;

  const isDeceased = !!member.deathDate;
  const fullName = member.familyName + (member.givenName ? " " + member.givenName : "");
  const fullNameKana = member.familyNameKana
    ? member.familyNameKana + (member.givenNameKana ? " " + member.givenNameKana : "")
    : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={isDeceased ? "/kakucho" : "/genzaicho"} className="text-stone-400 hover:text-stone-600 text-sm">
          {isDeceased ? "← 過去帳一覧へ" : "← 現在帳一覧へ"}
        </Link>
        <h1 className="text-2xl font-bold text-stone-800">{fullName}</h1>
        {isDeceased && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">故人</span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-700 mb-4">個人情報</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <dt className="text-stone-400 text-xs mb-0.5">氏名</dt>
            <dd className="font-medium text-stone-800">{fullName}</dd>
            {fullNameKana && <dd className="text-stone-500 text-xs mt-0.5">{fullNameKana}</dd>}
          </div>
          {member.relation && (
            <div>
              <dt className="text-stone-400 text-xs mb-0.5">続柄</dt>
              <dd className="text-stone-700">{member.relation}</dd>
            </div>
          )}
          <div>
            <dt className="text-stone-400 text-xs mb-0.5">生年月日</dt>
            <dd className="text-stone-700">{formatDate(member.birthDate)}</dd>
          </div>
          {!isDeceased && member.birthDate && (
            <div>
              <dt className="text-stone-400 text-xs mb-0.5">年齢</dt>
              <dd className="text-stone-700">{calcAge(member.birthDate)}</dd>
            </div>
          )}
          {isDeceased && (
            <>
              <div>
                <dt className="text-stone-400 text-xs mb-0.5">命日</dt>
                <dd className="text-stone-700">{formatDate(member.deathDate)}</dd>
              </div>
              {member.dharmaName && (
                <div>
                  <dt className="text-stone-400 text-xs mb-0.5">法名</dt>
                  <dd className="font-medium text-stone-700">
                    {member.dharmaName}
                    {member.dharmaNameKana && (
                      <span className="text-xs text-stone-400 ml-1 font-normal">({member.dharmaNameKana})</span>
                    )}
                  </dd>
                </div>
              )}
            </>
          )}
          {member.note && (
            <div className="col-span-2">
              <dt className="text-stone-400 text-xs mb-0.5">備考</dt>
              <dd className="text-stone-700 whitespace-pre-wrap">{member.note}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-700 mb-4">所属戸主</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <dt className="text-stone-400 text-xs mb-0.5">家族・親族台帳</dt>
            {member.householder.familyRegister ? (
              <dd>
                <Link
                  href={"/family-register/" + member.householder.familyRegister.id}
                  className="text-amber-700 hover:text-amber-800 hover:underline font-medium"
                >
                  {member.householder.familyRegister.name}
                </Link>
              </dd>
            ) : (
              <dd className="text-stone-400">未紐付け</dd>
            )}
          </div>
          <div>
            <dt className="text-stone-400 text-xs mb-0.5">戸主名</dt>
            <dd className="font-medium text-stone-700">
              {member.householder.familyName} {member.householder.givenName}
            </dd>
            {member.householder.familyNameKana && (
              <dd className="text-stone-500 text-xs">
                {member.householder.familyNameKana} {member.householder.givenNameKana || ""}
              </dd>
            )}
          </div>
          <div>
            <dt className="text-stone-400 text-xs mb-0.5">戸主番号</dt>
            <dd className="font-mono text-stone-700">{member.householder.householderCode}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-stone-400 text-xs mb-0.5">住所</dt>
            <dd className="text-stone-700">{joinAddress(member.householder)}</dd>
          </div>
          {member.householder.phone1 && (
            <div>
              <dt className="text-stone-400 text-xs mb-0.5">電話番号</dt>
              <dd className="text-stone-700">
                {member.householder.phone1}
                {member.householder.phone2 ? " / " + member.householder.phone2 : ""}
              </dd>
            </div>
          )}
          {member.householder.email && (
            <div>
              <dt className="text-stone-400 text-xs mb-0.5">メールアドレス</dt>
              <dd className="text-stone-700">{member.householder.email}</dd>
            </div>
          )}
        </dl>
        <div className="mt-4">
          <Link
            href={"/householder/" + member.householder.id}
            className="text-sm text-stone-600 hover:text-stone-800 border border-stone-300 px-3 py-1.5 rounded-lg inline-block"
          >
            戸主詳細を見る →
          </Link>
        </div>
      </div>
    </div>
  );
}
