"use client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback, useOptimistic, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ============================================================
// 型定義
// ============================================================
interface KakochoRecord {
  id: string;
  householderId: string;
  familyName: string;
  givenName: string | null;
  familyNameKana: string | null;
  givenNameKana: string | null;
  relation: string | null;
  gender: string | null;
  birthDate: string | null;
  deathDate: string | null;
  dharmaName: string | null;
  dharmaNameKana: string | null;
  note: string | null;
  isAnnaiFuyo: boolean;
  isKeijiFuyo: boolean;
  isNotePrintDisabled: boolean;
  isMeinichiFusho: boolean;
  householder: {
    id: string;
    householderCode: string;
    familyName: string;
    givenName: string;
    familyRegister: { id: string; name: string } | null;
  };
}

type SortMode = "nen" | "getsu" | "nichi" | "fusho" | "fumei";

// ============================================================
// 元号ユーティリティ
// ============================================================
const ERAS = [
  { name: "令和", start: new Date("2019-05-01"), baseYear: 2019 },
  { name: "平成", start: new Date("1989-01-08"), baseYear: 1989 },
  { name: "昭和", start: new Date("1926-12-25"), baseYear: 1926 },
  { name: "大正", start: new Date("1912-07-30"), baseYear: 1912 },
  { name: "明治", start: new Date("1868-01-25"), baseYear: 1868 },
];

function toJapaneseEra(dateStr: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  for (const era of ERAS) {
    if (date >= era.start) {
      const year = date.getFullYear() - era.baseYear + 1;
      return {
        era: era.name,
        year,
        month: date.getMonth() + 1,
        day: date.getDate(),
        gregorian: date.getFullYear(),
      };
    }
  }
  return null;
}

function formatBirthDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = toJapaneseEra(dateStr);
  if (!d) return "";
  const m = String(d.month).padStart(2, "0");
  const day = String(d.day).padStart(2, "0");
  return `${d.era}${d.gregorian}年${m}月${day}日`;
}

function calcAge(birthDate: string | null, deathDate: string | null): string {
  if (!birthDate || !deathDate) return "";
  const birth = new Date(birthDate);
  const death = new Date(deathDate);
  let age = death.getFullYear() - birth.getFullYear();
  if (
    death.getMonth() < birth.getMonth() ||
    (death.getMonth() === birth.getMonth() && death.getDate() < birth.getDate())
  ) age--;
  if (age < 0) return "";
  return String(age);
}

// 初盆チェック（前のお盆から次のお盆の間に亡くなった場合）
function isHatsubon(deathDate: string | null): boolean {
  if (!deathDate) return false;
  const death = new Date(deathDate);
  const thisYear = new Date().getFullYear();
  const thisObon = new Date(thisYear, 7, 15);
  const prevObon = new Date(thisYear - 1, 7, 15);
  return death > prevObon && death <= thisObon;
}

// 年回法要の名前
const NENKAI: Record<number, string> = {
  1: "一周忌", 2: "三回忌", 6: "七回忌", 12: "十三回忌",
  16: "十七回忌", 22: "二十三回忌", 24: "二十五回忌", 26: "二十七回忌",
  32: "三十三回忌", 36: "三十七回忌", 49: "五十回忌", 99: "百回忌",
};

function getNenkai(deathDate: string | null): string | null {
  if (!deathDate) return null;
  const diff = new Date().getFullYear() - new Date(deathDate).getFullYear();
  return NENKAI[diff] ?? null;
}

// ============================================================
// 定数
// ============================================================
const SORT_TABS: { id: SortMode; label: string }[] = [
  { id: "nen",   label: "年月日順" },
  { id: "getsu", label: "月日順" },
  { id: "nichi", label: "日順" },
  { id: "fusho", label: "命日不詳" },
  { id: "fumei", label: "戸主不明" },
];

const ERA_NAMES = ["令和", "平成", "昭和", "大正", "明治"];
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

// ============================================================
// チェックボックスの即時更新コンポーネント
// ============================================================
function InlineCheckbox({
  memberId,
  field,
  value,
  label,
  onSaved,
}: {
  memberId: string;
  field: string;
  value: boolean;
  label: string;
  onSaved: (id: string, field: string, val: boolean) => void;
}) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [, startTransition] = useTransition();

  const toggle = () => {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      try {
        const res = await fetchWithAuth(`/api/kakocho/${memberId}/flags`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: next }),
        });
        if (res.ok) onSaved(memberId, field, next);
      } catch {
        // 失敗時はロールバック
      }
    });
  };

  return (
    <label className="flex items-center gap-0.5 cursor-pointer text-[10px] text-stone-700 select-none">
      <input
        type="checkbox"
        checked={optimistic}
        onChange={toggle}
        className="w-3 h-3 accent-stone-600"
      />
      <span>{label}</span>
    </label>
  );
}

// ============================================================
// メインページ
// ============================================================
export default function KakochoPage() {
  const router = useRouter();

  const [sortMode, setSortMode]     = useState<SortMode>("nen");
  const [order, setOrder]           = useState<"asc" | "desc">("asc");
  const [filterEra, setFilterEra]   = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [query, setQuery]           = useState("");
  const [pageSize, setPageSize]     = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [records, setRecords]       = useState<KakochoRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);

  const handleFlagSaved = useCallback(
    (id: string, field: string, val: boolean) => {
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
      );
    },
    []
  );

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("sort", sortMode);
      params.set("order", order);
      if (query) params.set("q", query);
      if (filterEra && filterYear) {
        params.set("era", filterEra);
        params.set("year", filterYear);
      }
      const res = await fetchWithAuth("/api/kakocho?" + params);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sortMode, order, query, filterEra, filterYear]);

  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(fetchRecords, 200);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const pageRecords = records.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="bg-gray-100 min-h-screen -mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
      {/* ── ツールバー ── */}
      <div className="bg-gray-200 border-b border-gray-400 px-2 py-1 flex items-center gap-1.5">
        <button
          onClick={() => router.back()}
          className="px-3 py-0.5 bg-gray-100 border border-gray-400 rounded hover:bg-white text-stone-800 text-xs"
        >
          閉じる
        </button>
        <button
          onClick={() => fetchRecords()}
          className="px-3 py-0.5 bg-gray-100 border border-gray-400 rounded hover:bg-white text-stone-800 text-xs"
        >
          記入を戻す
        </button>
        <div className="relative">
          <button
            onClick={() => setShowPageSizeMenu(!showPageSizeMenu)}
            className="px-3 py-0.5 bg-gray-100 border border-gray-400 rounded hover:bg-white text-stone-800 text-xs flex items-center gap-1"
          >
            表示行数変更 <span className="text-[9px]">▼</span>
          </button>
          {showPageSizeMenu && (
            <div className="absolute left-0 top-full mt-0.5 bg-white border border-gray-400 shadow-lg z-50 rounded text-xs">
              {PAGE_SIZE_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => { setPageSize(n); setCurrentPage(1); setShowPageSizeMenu(false); }}
                  className={`block w-full text-left px-4 py-1.5 hover:bg-blue-100 ${pageSize === n ? "bg-blue-50 font-bold" : ""}`}
                >
                  {n}件
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ソートタブ + 並び順 ── */}
      <div className="bg-gray-100 border-b border-gray-400 px-2 py-1 flex items-center gap-1 flex-wrap">
        {/* アイコン + タイトル */}
        <span className="text-xs font-bold text-stone-800 mr-1 flex items-center gap-1">
          <span className="text-sm leading-none">📖</span>
          <span>過去帳</span>
        </span>
        <button
          onClick={() => router.push("/householder")}
          className="px-2 py-0.5 text-[10px] bg-gray-100 border border-gray-400 rounded hover:bg-white mr-2 text-stone-700"
        >
          追加行へ
        </button>

        {/* ソートタブ */}
        {SORT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setSortMode(tab.id); setCurrentPage(1); }}
            className={`px-3 py-0.5 text-xs border rounded font-medium transition-colors ${
              sortMode === tab.id
                ? "bg-blue-700 text-white border-blue-800 shadow-inner"
                : "bg-gray-100 text-stone-700 border-gray-400 hover:bg-white"
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* 並び順ラジオ */}
        <div className="flex items-center gap-3 ml-2">
          {(["asc", "desc"] as const).map((v, i) => (
            <label key={v} className="flex items-center gap-0.5 text-xs cursor-pointer">
              <input
                type="radio"
                name="order"
                checked={order === v}
                onChange={() => { setOrder(v); setCurrentPage(1); }}
                className="accent-stone-700"
              />
              {i === 0 ? "月日の若い順" : "月日の古い順"}
            </label>
          ))}
        </div>
      </div>

      {/* ── フィルタ行 ── */}
      <div className="bg-white border-b border-gray-400 px-3 py-1 flex items-center gap-1.5 text-xs flex-wrap">
        <select
          value={filterEra}
          onChange={(e) => { setFilterEra(e.target.value); setCurrentPage(1); }}
          className="border border-gray-400 rounded px-1 py-0.5 bg-white text-stone-800 text-xs"
        >
          <option value="">元号</option>
          {ERA_NAMES.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <input
          type="number"
          value={filterYear}
          onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }}
          placeholder="年"
          className="w-12 border border-gray-400 rounded px-1 py-0.5 text-stone-800 text-xs"
          min={1} max={99}
        />
        <span className="text-stone-600">年</span>
        <span className="ml-2 text-stone-600">俗名法名に</span>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
          className="border border-gray-400 rounded px-2 py-0.5 w-36 text-stone-800 text-xs"
          placeholder="氏名・法名..."
        />
        <span className="text-stone-600">を含む</span>
        <span className="ml-auto text-stone-500 font-medium">
          {loading ? "読込中..." : `${records.length}人`}
        </span>
      </div>

      {/* ── カラムヘッダ（デスクトップ） ── */}
      <div className="hidden md:flex items-center bg-gray-50 border-b border-gray-300 px-1 py-0.5 text-[10px] text-stone-600 font-semibold gap-0 select-none">
        <div className="w-[56px] shrink-0 px-1">操作</div>
        <div className="flex-1 min-w-0 px-1">俗名<span className="text-gray-400 font-normal">/フリガナ</span></div>
        <div className="flex-1 min-w-0 px-1">法名<span className="text-gray-400 font-normal">/戸主</span></div>
        <div className="w-16 shrink-0 px-1">性別<span className="text-gray-400 font-normal">/続柄</span></div>
        <div className="w-48 shrink-0 px-1">命日 <span className="text-red-500 font-bold">?</span></div>
        <div className="w-16 shrink-0 px-1 text-center">享年</div>
        <div className="w-[88px] shrink-0 px-1">案内<span className="text-gray-400 font-normal">/掲示不要</span></div>
        <div className="w-14 shrink-0 px-1 text-right">回忌</div>
      </div>

      {/* ── レコードリスト ── */}
      <div className="p-1 space-y-0.5">
        {loading ? (
          <div className="text-center py-16 text-stone-400 text-sm">読み込み中...</div>
        ) : pageRecords.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm">
            <p className="font-medium">過去帳の記録がありません</p>
            {sortMode === "fusho" && (
              <p className="text-xs mt-1 text-stone-400">「命日不詳」フラグが有効な世帯員が表示されます</p>
            )}
            {sortMode === "fumei" && (
              <p className="text-xs mt-1 text-stone-400">戸主情報が不完全な記録が表示されます</p>
            )}
          </div>
        ) : (
          pageRecords.map((record) => (
            <KakochoRow
              key={record.id}
              record={record}
              onFlagSaved={handleFlagSaved}
            />
          ))
        )}
      </div>

      {/* ── ページネーション ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-3 bg-gray-100 border-t border-gray-300 text-xs">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
            className="px-2 py-0.5 border border-gray-400 rounded bg-white hover:bg-gray-50 disabled:opacity-40">
            |&lt;
          </button>
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="px-2 py-0.5 border border-gray-400 rounded bg-white hover:bg-gray-50 disabled:opacity-40">
            ← 前
          </button>
          <span className="text-stone-600 min-w-[60px] text-center">{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="px-2 py-0.5 border border-gray-400 rounded bg-white hover:bg-gray-50 disabled:opacity-40">
            次 →
          </button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
            className="px-2 py-0.5 border border-gray-400 rounded bg-white hover:bg-gray-50 disabled:opacity-40">
            &gt;|
          </button>
          <span className="text-stone-400 ml-2">
            {(currentPage - 1) * pageSize + 1}〜{Math.min(currentPage * pageSize, records.length)}件
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 1レコード分のカード
// ============================================================
function KakochoRow({
  record,
  onFlagSaved,
}: {
  record: KakochoRecord;
  onFlagSaved: (id: string, field: string, val: boolean) => void;
}) {
  const era     = toJapaneseEra(record.deathDate);
  const age     = calcAge(record.birthDate, record.deathDate);
  const hatsubon = isHatsubon(record.deathDate);
  const nenkai  = getNenkai(record.deathDate);
  const birthStr = formatBirthDate(record.birthDate);
  const isMonshinTo = record.householder?.familyRegister != null;

  return (
    <div className="bg-white border-2 border-red-300 rounded text-xs leading-tight">

      {/* ── 行1: 主要情報 ── */}
      <div className="flex items-center gap-0.5 px-1 pt-1 pb-0.5">

        {/* 操作 / 詳細ボタン */}
        <div className="flex flex-col gap-0.5 w-[56px] shrink-0">
          <button className="px-1 py-0.5 bg-gray-200 border border-gray-400 rounded text-[10px] hover:bg-gray-100 leading-tight w-full text-center">
            操作
          </button>
          <Link
            href={`/members/${record.id}`}
            className="block text-center px-1 py-0.5 bg-gray-200 border border-gray-400 rounded text-[10px] hover:bg-gray-100 leading-tight"
          >
            詳細
          </Link>
        </div>

        {/* 俗名 */}
        <div className="flex-1 min-w-0 px-1">
          <span className="font-bold text-stone-900 text-[13px]">
            {record.familyName}
            {record.givenName ? `　${record.givenName}` : ""}
          </span>
        </div>

        {/* 法名 */}
        <div className="flex-1 min-w-0 px-1">
          <span className="text-stone-700">
            {record.dharmaName ?? <span className="text-stone-300">（法名未登録）</span>}
          </span>
        </div>

        {/* 性別 */}
        <div className="w-16 shrink-0 px-1">
          <GenderBadge gender={record.gender} />
        </div>

        {/* 命日：元号・年・月・日 */}
        <div className="w-48 shrink-0 px-1 flex items-center gap-0.5">
          {era ? (
            <>
              <span className="text-stone-600 text-[10px]">{era.era}</span>
              <span className="font-medium text-stone-800">{era.year}年</span>
              <span className="text-stone-700">{era.month}月{era.day}日</span>
            </>
          ) : record.isMeinichiFusho ? (
            <span className="text-amber-700 text-[10px]">命日不詳</span>
          ) : (
            <span className="text-stone-300">－</span>
          )}
          {/* 命日不詳フラグ */}
          <label className="ml-0.5 flex items-center gap-0.5 cursor-pointer" title="命日不詳">
            <input
              type="checkbox"
              checked={record.isMeinichiFusho}
              onChange={async () => {
                const next = !record.isMeinichiFusho;
                try {
                  await fetchWithAuth(`/api/kakocho/${record.id}/flags`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isMeinichiFusho: next }),
                  });
                  onFlagSaved(record.id, "isMeinichiFusho", next);
                } catch { /* ignore */ }
              }}
              className="w-3 h-3 accent-red-600"
            />
            <span className="text-red-500 font-bold">?</span>
          </label>
        </div>

        {/* 享年 */}
        <div className="w-16 shrink-0 px-1 text-center">
          {age ? (
            <>
              <span className="font-medium text-stone-800">{age}</span>
              <span className="text-[10px] text-stone-500">才</span>
            </>
          ) : (
            <span className="text-stone-300">－</span>
          )}
        </div>

        {/* 案内不要 / 掲示不要 */}
        <div className="w-[88px] shrink-0 px-1 flex flex-col gap-0.5">
          <InlineCheckbox memberId={record.id} field="isAnnaiFuyo"  value={record.isAnnaiFuyo}  label="案内不要" onSaved={onFlagSaved} />
          <InlineCheckbox memberId={record.id} field="isKeijiFuyo"  value={record.isKeijiFuyo}  label="掲示不要" onSaved={onFlagSaved} />
        </div>

        {/* 回忌 */}
        <div className="w-14 shrink-0 px-1 text-right">
          {hatsubon ? (
            <Link href={`/members/${record.id}`} className="text-blue-600 hover:underline font-semibold">
              初盆
            </Link>
          ) : nenkai ? (
            <span className="text-amber-700 font-medium">{nenkai}</span>
          ) : null}
        </div>
      </div>

      {/* ── 行2: フリガナ・戸主・続柄・年回表示 ── */}
      <div className="flex items-center gap-0.5 px-1 py-0.5">
        <div className="w-[56px] shrink-0" />

        {/* フリガナ */}
        <div className="flex-1 min-w-0 px-1 text-stone-400 text-[10px]">
          {[record.familyNameKana, record.givenNameKana].filter(Boolean).join("　")}
        </div>

        {/* 戸主 */}
        <div className="flex-1 min-w-0 px-1">
          <Link
            href={`/householder/${record.householder.id}`}
            className="text-stone-600 hover:underline hover:text-stone-900"
          >
            {record.householder.familyName}　{record.householder.givenName}
          </Link>
        </div>

        {/* 続柄 */}
        <div className="w-16 shrink-0 px-1 text-stone-600">
          {record.relation ?? "－"}
        </div>

        {/* 年回表示 */}
        <div className="w-48 shrink-0 px-1">
          <NenkaiButton deathDate={record.deathDate} memberId={record.id} />
        </div>

        {/* スペーサー（享年列） */}
        <div className="w-16 shrink-0" />

        {/* 案内・掲示列スペーサー → 代わりに続柄バッジ表示 */}
        <div className="w-[88px] shrink-0 px-1">
          {isMonshinTo ? (
            <span className="text-[10px] text-blue-700 border border-blue-300 rounded px-1 bg-blue-50">門信徒</span>
          ) : (
            <span className="text-[10px] text-stone-400 border border-stone-200 rounded px-1 bg-stone-50">その他</span>
          )}
        </div>
        <div className="w-14 shrink-0" />
      </div>

      {/* ── 行3: 生年月日・備考 ── */}
      <div className="flex items-center gap-1 px-1 pb-1">
        <div className="w-[56px] shrink-0" />
        <span className="text-stone-500 shrink-0 text-[10px]">生年月日</span>
        <span className="text-stone-700 w-36 shrink-0 text-[10px]">
          {birthStr || <span className="text-stone-300">－</span>}
        </span>
        <span className="text-stone-500 shrink-0 text-[10px]">備考</span>
        <span className="flex-1 min-w-0 text-stone-700 truncate text-[10px]">
          {record.note ?? ""}
        </span>
        <InlineCheckbox
          memberId={record.id}
          field="isNotePrintDisabled"
          value={record.isNotePrintDisabled}
          label="備考印刷不可"
          onSaved={onFlagSaved}
        />
        <div className="w-14 shrink-0" />
      </div>
    </div>
  );
}

// ============================================================
// 性別バッジ
// ============================================================
function GenderBadge({ gender }: { gender: string | null }) {
  if (!gender) return <span className="text-stone-300 text-[10px]">－</span>;
  const isM = ["男", "male", "M"].includes(gender);
  const isF = ["女", "female", "F"].includes(gender);
  return (
    <span className={`inline-block px-1.5 py-0 rounded text-[10px] font-medium border leading-4 ${
      isM ? "bg-blue-50 text-blue-700 border-blue-200" :
      isF ? "bg-pink-50 text-pink-700 border-pink-200" :
            "bg-gray-50 text-gray-600 border-gray-200"
    }`}>
      {isM ? "男" : isF ? "女" : gender}
    </span>
  );
}

// ============================================================
// 年回表示ボタン（今年の年回 or 次の年回）
// ============================================================
function NenkaiButton({
  deathDate,
  memberId,
}: {
  deathDate: string | null;
  memberId: string;
}) {
  const nenkai  = getNenkai(deathDate);
  const hatsubon = isHatsubon(deathDate);

  function getNextNenkai(): string | null {
    if (!deathDate) return null;
    const diff = new Date().getFullYear() - new Date(deathDate).getFullYear();
    const future = Object.keys(NENKAI).map(Number).filter((y) => y > diff);
    if (!future.length) return null;
    const next = Math.min(...future);
    return `${NENKAI[next]}（${next - diff}年後）`;
  }

  const label = hatsubon ? "初盆" : nenkai ?? getNextNenkai() ?? "年回表示";

  return (
    <Link
      href={`/members/${memberId}`}
      className="inline-block px-2 py-0 text-[10px] border border-gray-400 rounded bg-gray-50 hover:bg-white text-stone-700 leading-4"
    >
      {label}
    </Link>
  );
}
