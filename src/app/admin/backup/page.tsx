"use client";

import { useState, useRef } from "react";

type RestoreSummary = Record<string, number>;

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);

  // --- リカバリー ---
  const [file, setFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [summary, setSummary] = useState<RestoreSummary | null>(null);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("バックアップの取得に失敗しました");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename\*=UTF-8''(.+)/);
      a.download = match ? decodeURIComponent(match[1]) : "テラコード_バックアップ.zip";
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("バックアップのダウンロードに失敗しました。");
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setSummary(null);
    setError("");
  };

  const handleRestore = async () => {
    if (!file) return;
    setConfirmOpen(false);
    setRestoring(true);
    setSummary(null);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "リカバリーに失敗しました");
      } else {
        setSummary(data.summary as RestoreSummary);
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setRestoring(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSummary(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const total = summary
    ? Object.values(summary).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-amber-700">
          データバックアップ &amp; リカバリー
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          全データを YAML 形式の ZIP ファイルとしてバックアップ、またはバックアップファイルからリカバリーします。
        </p>
      </div>

      {/* ===== バックアップ ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-700">バックアップ</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-stone-600">
            戸主・世帯員・法要・家族親族台帳など、全てのデータを YAML ファイルに変換し ZIP でダウンロードします。
          </p>
          <button
            onClick={handleBackup}
            disabled={downloading}
            className="bg-amber-700 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {downloading ? "ダウンロード中..." : "バックアップをダウンロード"}
          </button>
        </div>
      </div>

      {/* ===== リカバリー ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-700">リカバリー</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* 注意書き */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 space-y-1">
            <p className="font-medium">リカバリー前にご確認ください</p>
            <ul className="list-disc list-inside space-y-0.5 text-red-700">
              <li>既存データは全て削除され、バックアップデータで上書きされます。</li>
              <li>ユーザーアカウントは影響を受けません。</li>
              <li>この操作は取り消せません。事前にバックアップを取得してください。</li>
            </ul>
          </div>

          {/* ファイル選択 */}
          <div
            className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center cursor-pointer hover:border-stone-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <div>
                <p className="font-medium text-stone-700">{file.name}</p>
                <p className="text-sm text-stone-400 mt-1">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-stone-500">
                  クリックしてバックアップ ZIP ファイルを選択
                </p>
                <p className="text-sm text-stone-400 mt-1">
                  テラコード_バックアップ_*.zip
                </p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
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
            {(file || summary) && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
              >
                リセット
              </button>
            )}
            <button
              type="button"
              disabled={!file || restoring}
              onClick={() => setConfirmOpen(true)}
              className="bg-red-700 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {restoring ? "リカバリー中..." : "リカバリー開始"}
            </button>
          </div>
        </div>
      </div>

      {/* 確認ダイアログ */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-700">リカバリーの確認</h3>
            <p className="text-sm text-stone-600">
              既存データを全て削除し、バックアップファイルのデータで置き換えます。
              この操作は取り消せません。
            </p>
            <p className="text-sm font-medium text-stone-800">
              本当にリカバリーを実行しますか？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 text-sm text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleRestore}
                className="bg-red-700 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-red-600 transition-colors"
              >
                リカバリーを実行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 進行中インジケーター */}
      {restoring && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
          </div>
          <p className="text-stone-600 text-sm">
            リカバリーを実行しています。しばらくお待ちください...
          </p>
        </div>
      )}

      {/* リカバリー結果 */}
      {summary && !restoring && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-700">リカバリー結果</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              リカバリーが完了しました。合計 {total} 件のデータを復元しました。
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(summary).map(([label, count]) => (
                <div
                  key={label}
                  className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-center"
                >
                  <div className="text-xl font-bold text-stone-700">
                    {count}
                  </div>
                  <div className="text-xs text-stone-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
