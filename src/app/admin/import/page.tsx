"use client";

import { useState, useRef } from "react";

type ImportResult = {
  householders: number;
  members: number;
  errors: number;
  errorDetails: string[];
};

export default function MdbImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import/mdb", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "インポートに失敗しました");
      } else {
        setResult(data as ImportResult);
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-amber-700">MDBデータインポート</h1>
        <p className="text-stone-500 text-sm mt-1">
          寺院管理ソフト（J2善法寺など）の .mdb ファイルから戸主・家族データを一括インポートします。
        </p>
      </div>

      {/* 注意書き */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 space-y-1">
        <p className="font-medium">インポート前にご確認ください</p>
        <ul className="list-disc list-inside space-y-0.5 text-amber-700">
          <li>インポートは既存データに追記されます（重複チェックなし）。</li>
          <li>対象テーブル: UTB001_戸主（戸主台帳）・UTB002_家族（家族員）</li>
          <li>大量データのインポートには数分かかる場合があります。</li>
        </ul>
      </div>

      {/* アップロードフォーム */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-700">MDBファイルを選択</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div
            className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center cursor-pointer hover:border-stone-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <div className="text-4xl mb-3">📂</div>
            {file ? (
              <div>
                <p className="font-medium text-stone-700">{file.name}</p>
                <p className="text-sm text-stone-400 mt-1">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-stone-500">クリックして .mdb ファイルを選択</p>
                <p className="text-sm text-stone-400 mt-1">
                  Microsoft Access データベースファイル (.mdb)
                </p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".mdb,.accdb"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            {(file || result) && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
              >
                リセット
              </button>
            )}
            <button
              type="submit"
              disabled={!file || loading}
              className="bg-amber-700 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "インポート中..." : "インポート開始"}
            </button>
          </div>
        </form>
      </div>

      {/* 進行中インジケーター */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
          </div>
          <p className="text-stone-600 text-sm">
            データをインポートしています。しばらくお待ちください...
          </p>
        </div>
      )}

      {/* インポート結果 */}
      {result && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-700">インポート結果</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-700">{result.householders}</div>
                <div className="text-sm text-green-600 mt-1">戸主</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-700">{result.members}</div>
                <div className="text-sm text-blue-600 mt-1">家族員</div>
              </div>
              <div className={`border rounded-lg p-4 text-center ${result.errors > 0 ? "bg-red-50 border-red-200" : "bg-stone-50 border-stone-200"}`}>
                <div className={`text-3xl font-bold ${result.errors > 0 ? "text-red-700" : "text-stone-400"}`}>
                  {result.errors}
                </div>
                <div className={`text-sm mt-1 ${result.errors > 0 ? "text-red-600" : "text-stone-400"}`}>
                  エラー
                </div>
              </div>
            </div>

            {result.errors === 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                インポートが完了しました。戸主 {result.householders} 件・家族員 {result.members} 件を登録しました。
              </div>
            )}

            {result.errorDetails.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-700">エラー詳細（最大50件）:</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1 max-h-64 overflow-y-auto">
                  {result.errorDetails.map((msg, i) => (
                    <p key={i} className="text-xs text-red-700 font-mono">{msg}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
