-- 世帯員の氏名（カナ）を姓（カナ）・名（カナ）に分割
ALTER TABLE "DankaMember" ADD COLUMN "familyNameKana" TEXT;
ALTER TABLE "DankaMember" ADD COLUMN "givenNameKana" TEXT;

-- 既存データを移行（nameKana を familyNameKana にコピー）
UPDATE "DankaMember" SET "familyNameKana" = "nameKana";

-- 旧カラムを削除
ALTER TABLE "DankaMember" DROP COLUMN "nameKana";
