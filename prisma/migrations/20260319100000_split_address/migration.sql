-- 住所を3フィールドに分割（既存データは address1 に移行）
ALTER TABLE "Danka" ADD COLUMN "address1" TEXT;
ALTER TABLE "Danka" ADD COLUMN "address2" TEXT;
ALTER TABLE "Danka" ADD COLUMN "address3" TEXT;

-- 既存の address データを address1 に移行
UPDATE "Danka" SET "address1" = "address" WHERE "address" IS NOT NULL;

-- 旧 address カラムを削除
ALTER TABLE "Danka" DROP COLUMN "address";
