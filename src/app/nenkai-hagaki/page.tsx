"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useCallback } from "react";

// ── 型定義 ──
interface NenkaiRecord {
  id: string;
  familyName: string;
  givenName: string | null;
  dharmaName: string | null;
  deathDate: string;
  nenkaiLabel: string;
  householder: {
    id: string;
    familyName: string;
    givenName: string;
    postalCode: string | null;
    address1: string | null;
    address2: string | null;
    address3: string | null;
  };
}

// ── 元号変換 ──
const ERAS = [
  { name: "令和", start: new Date("2019-05-01"), baseYear: 2018 },
  { name: "平成", start: new Date("1989-01-08"), baseYear: 1988 },
  { name: "昭和", start: new Date("1926-12-25"), baseYear: 1925 },
  { name: "大正", start: new Date("1912-07-30"), baseYear: 1911 },
  { name: "明治", start: new Date("1868-01-25"), baseYear: 1867 },
];

function toWareki(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  for (const era of ERAS) {
    if (d >= era.start) {
      const ey = y - era.baseYear;
      return `${era.name}${ey}年${d.getMonth() + 1}月${d.getDate()}日`;
    }
  }
  return `${y}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function toWarekiYear(year: number): string {
  const d = new Date(year, 0, 1);
  for (const era of ERAS) {
    if (d >= era.start) {
      return `${era.name}${year - era.baseYear}年`;
    }
  }
  return `${year}年`;
}

// ── メインページ ──
export default function NenkaiHagakiPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<NenkaiRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printMode, setPrintMode] = useState<null | "tsushin" | "atena">(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setFetched(false);
    try {
      const res = await fetchWithAuth(
        `/api/nenkai-hagaki?year=${year}&month=${month}`,
      );
      const data = await res.json();
      const list: NenkaiRecord[] = Array.isArray(data) ? data : [];
      setRecords(list);
      setSelected(new Set(list.map((r) => r.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [year, month]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === records.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(records.map((r) => r.id)));
    }
  };

  const selectedRecords = records.filter((r) => selected.has(r.id));

  // 印刷モード
  if (printMode) {
    return (
      <PrintView
        records={selectedRecords}
        mode={printMode}
        year={year}
        month={month}
        onBack={() => setPrintMode(null)}
      />
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">年回案内ハガキ</h1>

      {/* 月選択 */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-stone-500 mb-1">年</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || now.getFullYear())}
            className="border border-gray-300 rounded px-2 py-1.5 w-24 text-sm"
            min={1900}
            max={2100}
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">月</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchRecords}
          disabled={loading}
          className="px-4 py-1.5 bg-stone-800 text-white rounded hover:bg-stone-700 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? "検索中..." : "検索"}
        </button>
        {fetched && (
          <span className="text-sm text-stone-500 self-center">
            {records.length}件
          </span>
        )}
      </div>

      {/* 結果一覧 */}
      {fetched && records.length > 0 && (
        <>
          {/* 印刷ボタン */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setPrintMode("tsushin")}
              disabled={selected.size === 0}
              className="px-4 py-1.5 bg-blue-700 text-white rounded hover:bg-blue-600 disabled:opacity-40 text-sm font-medium"
            >
              通信面を印刷（{selected.size}件）
            </button>
            <button
              onClick={() => setPrintMode("atena")}
              disabled={selected.size === 0}
              className="px-4 py-1.5 bg-green-700 text-white rounded hover:bg-green-600 disabled:opacity-40 text-sm font-medium"
            >
              宛名面を印刷（{selected.size}件）
            </button>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300 text-left text-xs text-stone-600">
                  <th className="px-3 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === records.length}
                      onChange={toggleAll}
                      className="accent-stone-700"
                    />
                  </th>
                  <th className="px-3 py-2">故人名</th>
                  <th className="px-3 py-2">法名</th>
                  <th className="px-3 py-2">命日</th>
                  <th className="px-3 py-2">年回</th>
                  <th className="px-3 py-2">戸主</th>
                  <th className="px-3 py-2">住所</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="accent-stone-700"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {r.familyName}
                      {r.givenName ? `　${r.givenName}` : ""}
                    </td>
                    <td className="px-3 py-2 text-stone-600">
                      {r.dharmaName ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-stone-600">
                      {toWareki(r.deathDate)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                        {r.nenkaiLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {r.householder.familyName}　{r.householder.givenName}
                    </td>
                    <td className="px-3 py-2 text-stone-600 text-xs">
                      {[r.householder.address1, r.householder.address2, r.householder.address3]
                        .filter(Boolean)
                        .join(" ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {fetched && records.length === 0 && (
        <div className="text-center py-12 text-stone-400">
          {year}年{month}月に該当する年回はありません
        </div>
      )}
    </div>
  );
}

// ── 印刷ビュー ──
function PrintView({
  records,
  mode,
  year,
  month,
  onBack,
}: {
  records: NenkaiRecord[];
  mode: "tsushin" | "atena";
  year: number;
  month: number;
  onBack: () => void;
}) {
  return (
    <>
      {/* 操作バー（印刷時は非表示） */}
      <div className="print:hidden mb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-4 py-1.5 bg-gray-200 border border-gray-400 rounded hover:bg-gray-100 text-sm"
        >
          戻る
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-1.5 bg-stone-800 text-white rounded hover:bg-stone-700 text-sm font-medium"
        >
          印刷する
        </button>
        <span className="text-sm text-stone-500">
          {mode === "tsushin" ? "通信面" : "宛名面"} — {records.length}枚
        </span>
      </div>

      {/* ハガキ */}
      <div className="print:m-0 print:p-0">
        {records.map((r, i) => (
          <div
            key={r.id}
            className={`hagaki-page ${i < records.length - 1 ? "break-after-page" : ""}`}
          >
            {mode === "tsushin" ? (
              <TsushinMen record={r} year={year} month={month} />
            ) : (
              <AtenaMen record={r} />
            )}
          </div>
        ))}
      </div>

      {/* 印刷用CSS */}
      <style jsx global>{`
        @media print {
          /* ナビやlayoutの余白を全て消す */
          nav,
          header,
          footer {
            display: none !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
          }

          @page {
            size: 100mm 148mm;
            margin: 0;
          }

          .hagaki-page {
            width: 100mm;
            height: 148mm;
            margin: 0;
            padding: 0;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .break-after-page {
            page-break-after: always;
          }
        }

        /* 画面プレビュー用 */
        @media screen {
          .hagaki-page {
            width: 100mm;
            height: 148mm;
            border: 1px solid #ccc;
            margin: 0 auto 20px;
            overflow: hidden;
            background: white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
    </>
  );
}

// ── 通信面（年回案内） ──
function TsushinMen({
  record,
  year,
  month,
}: {
  record: NenkaiRecord;
  year: number;
  month: number;
}) {
  const deathWareki = toWareki(record.deathDate);
  const yearWareki = toWarekiYear(year);

  return (
    <div className="w-full h-full flex flex-col" style={{ padding: "8mm 8mm 6mm" }}>
      {/* タイトル */}
      <div className="text-center mb-2">
        <h2 className="text-[14px] font-bold tracking-[0.3em]">年回法要のご案内</h2>
      </div>

      {/* 挨拶文 */}
      <div className="text-[9px] leading-[1.8] mb-3 text-stone-800">
        <p>拝啓　時下ますますご清祥のこととお慶び申し上げます。</p>
        <p className="mt-1">
          さて、左記の通り年回法要の時期を迎えられますので、ご案内申し上げます。
          ご多忙中とは存じますが、ご参詣くださいますようお願い申し上げます。
        </p>
        <p className="text-right mt-1">合掌</p>
      </div>

      {/* 故人情報 */}
      <div className="border border-stone-400 rounded p-2 mb-3 text-[10px]">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="text-stone-500 pr-2 py-0.5 whitespace-nowrap align-top w-[4em]">故人名</td>
              <td className="font-bold py-0.5">
                {record.familyName}
                {record.givenName ? `　${record.givenName}` : ""} 様
              </td>
            </tr>
            {record.dharmaName && (
              <tr>
                <td className="text-stone-500 pr-2 py-0.5 whitespace-nowrap align-top">法名</td>
                <td className="py-0.5">{record.dharmaName}</td>
              </tr>
            )}
            <tr>
              <td className="text-stone-500 pr-2 py-0.5 whitespace-nowrap align-top">命日</td>
              <td className="py-0.5">{deathWareki}</td>
            </tr>
            <tr>
              <td className="text-stone-500 pr-2 py-0.5 whitespace-nowrap align-top">年回</td>
              <td className="py-0.5 font-bold text-[12px]">{record.nenkaiLabel}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 日時欄（手書き用） */}
      <div className="text-[9px] text-stone-600 mb-2">
        <p>日時・場所等の詳細は、お寺までお問い合わせください。</p>
      </div>

      {/* フッター */}
      <div className="mt-auto text-right text-[9px] text-stone-600">
        <p>{yearWareki}{month}月</p>
      </div>
    </div>
  );
}

// ── 宛名面 ──
function AtenaMen({ record }: { record: NenkaiRecord }) {
  const h = record.householder;
  const postalCode = h.postalCode
    ? h.postalCode.replace(/[-ー－]/g, "").replace(/(\d{3})(\d{4})/, "$1-$2")
    : "";
  const address = [h.address1, h.address2, h.address3].filter(Boolean);

  return (
    <div
      className="w-full h-full relative"
      style={{ padding: "10mm 8mm 8mm" }}
    >
      {/* 郵便番号 */}
      {postalCode && (
        <div
          className="absolute text-[12px] tracking-[0.35em] font-mono"
          style={{ top: "5mm", right: "10mm" }}
        >
          〒{postalCode}
        </div>
      )}

      {/* 住所 */}
      <div className="mt-6 text-[11px] leading-[1.8]">
        {address.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>

      {/* 宛名 */}
      <div className="mt-4 text-center">
        <p className="text-[16px] font-bold tracking-[0.2em]">
          {h.familyName}　{h.givenName}　様
        </p>
      </div>
    </div>
  );
}
