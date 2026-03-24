-- 電話番号を電話番号1・電話番号2に分割
ALTER TABLE "Danka" ADD COLUMN "phone1" TEXT;
ALTER TABLE "Danka" ADD COLUMN "phone2" TEXT;

-- 既存データを移行（既存の phone を phone1 にコピー）
UPDATE "Danka" SET "phone1" = phone;

-- 旧カラムを削除
ALTER TABLE "Danka" DROP COLUMN "phone";
