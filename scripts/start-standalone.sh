#!/usr/bin/env bash
# Next standalone は process.env.HOSTNAME で bind アドレスを決める。
# Linux ではシェルが HOSTNAME=ホスト名 を付与することがあり、0.0.0.0 で待ち受けられなくなるため明示する。
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export HOSTNAME="0.0.0.0"
export PORT="${PORT:-3000}"
# 手動起動や古い PM2 の残骸が 3000 を掴んだままだと EADDRINUSE で落ちる
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true
  sleep 1
fi

# next build の standalone 出力には public と .next/static が含まれない。
# 作業ディレクトリが .next/standalone のみのサーバーでも動くよう、起動直前に同期する。
STANDALONE="${ROOT}/.next/standalone"
if [[ -d "${STANDALONE}" ]]; then
  if [[ -d "${ROOT}/public" ]]; then
    mkdir -p "${STANDALONE}/public"
    cp -a "${ROOT}/public/." "${STANDALONE}/public/"
  fi
  if [[ -d "${ROOT}/.next/static" ]]; then
    mkdir -p "${STANDALONE}/.next/static"
    # 古いチャンクだけ残るとデバッグが紛らわしいので、ビルド結果と完全一致させる
    if command -v rsync >/dev/null 2>&1; then
      rsync -a --delete "${ROOT}/.next/static/" "${STANDALONE}/.next/static/"
    else
      rm -rf "${STANDALONE}/.next/static"
      mkdir -p "${STANDALONE}/.next/static"
      cp -a "${ROOT}/.next/static/." "${STANDALONE}/.next/static/"
    fi
  fi
fi

exec node .next/standalone/server.js
