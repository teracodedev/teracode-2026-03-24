#!/usr/bin/env bash
# docker-compose の nginx が network_mode: host のとき、上流は「ホストの」127.0.0.1:3000。
# Cursor 等で別ネット名前空間に載った PM2 デーモンから起動した Next は、ホストから見えず nginx が 502 になる。
# このスクリプトは PID 1 と同じネット名前空間で PM2 を立ち上げ直す（通常の SSH セッションなら不要）。
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

run_pm2() {
  cd "$ROOT"
  pm2 kill 2>/dev/null || true
  sleep 1
  pm2 start ecosystem.config.cjs
  pm2 save
}

if [ ! -r /proc/1/ns/net ]; then
  echo "error: /proc/1/ns/net が読めません（root で実行するか、nsenter が使える環境にしてください）" >&2
  exit 1
fi

SELF_NET="$(readlink /proc/self/ns/net)"
INIT_NET="$(readlink /proc/1/ns/net)"

if [ "$SELF_NET" = "$INIT_NET" ]; then
  run_pm2
  exit 0
fi

echo "現在のシェルと init のネット名前空間が異なります。nsenter で PM2 を再起動します…" >&2
sudo nsenter -t 1 -n runuser -u "${SUDO_USER:-ubuntu}" -- bash -lc "
  export HOME=\$(getent passwd '${SUDO_USER:-ubuntu}' | cut -d: -f6)
  export NVM_DIR=\"\$HOME/.nvm\"
  [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
  cd \"$ROOT\"
  pm2 kill 2>/dev/null || true
  sleep 1
  pm2 start ecosystem.config.cjs
  pm2 save
"
