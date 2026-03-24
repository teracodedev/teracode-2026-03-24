#!/bin/bash
# Let's Encrypt 初回証明書取得スクリプト
# 使い方: sudo bash nginx/init-cert.sh your@email.com

EMAIL=${1:?"使い方: $0 メールアドレス"}
DOMAIN="teracode6.zenpoji.or.jp"

echo "=== 証明書取得開始: $DOMAIN ==="

# certbotコンテナで証明書取得（webroot方式）
# まずnginxをHTTPのみで起動するため一時設定を使う
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

echo "=== 証明書取得完了 ==="
echo "=== nginx を再起動します ==="
docker compose restart nginx
echo "=== 完了 ==="
