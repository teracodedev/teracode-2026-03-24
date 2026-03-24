#!/bin/bash
set -e

echo "=== テラコード デプロイ ==="

cd "$(dirname "$0")"

echo "[1/5] git pull..."
git pull

echo "[2/5] npm install..."
npm ci

echo "[3/5] Prisma クライアント生成..."
npx prisma generate

echo "[4/5] PM2 停止..."
pm2 stop teracode 2>/dev/null || true

echo "[5/5] ビルド..."
rm -rf .next
npm run build

echo "[5b/5] standalone: public と .next/static をコピー..."
mkdir -p .next/standalone/.next
if [ -d public ]; then
  cp -r public .next/standalone/
fi
cp -r .next/static .next/standalone/.next/

echo "[5c/5] PM2 再起動..."
fuser -k 3000/tcp 2>/dev/null || true
sleep 1
pm2 restart teracode 2>/dev/null || pm2 start ecosystem.config.cjs

echo "[5d/5] nginx コンテナを再起動..."
docker compose restart nginx 2>/dev/null || docker-compose restart nginx 2>/dev/null || true

echo "=== デプロイ完了 ==="
pm2 list
