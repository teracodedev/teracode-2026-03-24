#!/bin/bash
set -e

echo "=== テラコード デプロイ ==="

cd "$(dirname "$0")"

prev_sha="$(git rev-parse HEAD 2>/dev/null || true)"

echo "[1/5] git pull..."
git pull
new_sha="$(git rev-parse HEAD 2>/dev/null || true)"

if [ -n "$prev_sha" ] && [ -n "$new_sha" ] && [ "$prev_sha" = "$new_sha" ] && [ -z "${FORCE_BUILD:-}" ]; then
  # 変更が無いのに毎回 build/pmp2/nginx を叩くと時間が無駄になるためスキップする
  if [ -f ".next/standalone/server.js" ]; then
    echo "[0/5] 変更なし: build をスキップします（FORCE_BUILD=1 で強制）"
    # サーバー死活に備えて再起動と nginx リロードだけ実施（ビルドはしない）
    fuser -k 3000/tcp 2>/dev/null || true
    sleep 1
    pm2 restart teracode 2>/dev/null || pm2 start ecosystem.config.cjs
    docker compose exec -T nginx nginx -s reload 2>/dev/null || \
      docker compose restart nginx 2>/dev/null || true
    exit 0
  fi
fi

changed_files=""
if [ -n "$prev_sha" ] && [ -n "$new_sha" ] && [ "$prev_sha" != "$new_sha" ]; then
  changed_files="$(git diff --name-only "$prev_sha" "$new_sha" 2>/dev/null || true)"
fi

need_npm_ci=false
need_prisma_generate=false

if [ ! -d node_modules ]; then
  need_npm_ci=true
fi

while IFS= read -r f; do
  case "$f" in
    package.json|package-lock.json)
      need_npm_ci=true
      ;;
    prisma/*)
      need_prisma_generate=true
      ;;
  esac
done <<EOF
$changed_files
EOF

if [ "$need_npm_ci" = true ]; then
  echo "[2/5] npm ci..."
  npm ci
else
  echo "[2/5] npm ci skip（dependencies unchanged）..."
fi

# npm ci 時の postinstall で prisma generate は既に走るため、npm ci をスキップした場合のみ実行する
if [ "$need_npm_ci" = false ] && [ "$need_prisma_generate" = true ]; then
  echo "[3/5] Prisma クライアント生成..."
  npx prisma generate
else
  echo "[3/5] Prisma クライアント生成 skip..."
fi

echo "[4/5] PM2 停止..."
pm2 stop teracode 2>/dev/null || true

echo "[5/5] ビルド..."
# ビルドキャッシュを活かすため、.next 全消しはしない（standalone/static だけ同期し直す）
rm -rf .next/standalone .next/static
npm run build

echo "[5b/5] standalone: public と .next/static を同期..."
mkdir -p .next/standalone/.next

if [ -d public ]; then
  mkdir -p .next/standalone/public
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete public/ .next/standalone/public/
  else
    cp -r public .next/standalone/
  fi
fi

if [ -d .next/static ]; then
  mkdir -p .next/standalone/.next/static
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete .next/static/ .next/standalone/.next/static/
  else
    cp -r .next/static .next/standalone/.next/
  fi
fi

echo "[5c/5] PM2 再起動..."
fuser -k 3000/tcp 2>/dev/null || true
sleep 1
pm2 restart teracode 2>/dev/null || pm2 start ecosystem.config.cjs

echo "[5d/5] nginx をリロード（失敗時は再起動）..."
docker compose exec -T nginx nginx -s reload 2>/dev/null || \
  docker compose restart nginx 2>/dev/null || \
  docker-compose exec -T nginx nginx -s reload 2>/dev/null || \
  docker-compose restart nginx 2>/dev/null || true

echo "=== デプロイ完了 ==="
pm2 list
