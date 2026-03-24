-- 既存の檀家番号（D001など）をUUIDで上書きするスクリプト
-- 実行方法: psql $DATABASE_URL -f scripts/update-uuid.sql

-- UUIDのパターン（既にUUIDならスキップ）
-- 例: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

-- 檀家番号をUUIDで上書き（UUIDでないものだけ対象）
UPDATE "Danka"
SET "dankaCode" = gen_random_uuid()::text
WHERE "dankaCode" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 結果確認
SELECT id, "dankaCode", "familyName", "givenName" FROM "Danka" ORDER BY "createdAt";
