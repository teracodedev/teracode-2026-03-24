#!/usr/bin/env bash
# デプロイ前チェック: standalone 用に同期後も、チャンクが揃っているか確認する。
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_CHUNKS="${ROOT}/.next/static/chunks/app"
STANDALONE_STATIC="${ROOT}/.next/standalone/.next/static/chunks/app"

if [[ ! -d "${APP_CHUNKS}" ]]; then
  echo "verify-next-static: ${APP_CHUNKS} がありません。先に npm run build してください。" >&2
  exit 1
fi

n_src=$(find "${APP_CHUNKS}" -name "*.js" 2>/dev/null | wc -l)
if [[ "${n_src}" -lt 1 ]]; then
  echo "verify-next-static: app チャンクが 1 個もありません。" >&2
  exit 1
fi

if [[ -d "${STANDALONE_STATIC}" ]]; then
  n_dst=$(find "${STANDALONE_STATIC}" -name "*.js" 2>/dev/null | wc -l)
  if [[ "${n_src}" -ne "${n_dst}" ]]; then
    echo "verify-next-static: 警告 — ソース .next/static/chunks/app (${n_src} 個) と" >&2
    echo "  standalone/.next/static/chunks/app (${n_dst} 個) の件数が一致しません。" >&2
    echo "  scripts/start-standalone.sh の rsync 後に再確認するか、手動で同期してください。" >&2
    exit 1
  fi
fi

echo "verify-next-static: OK（app チャンク ${n_src} 個）"
