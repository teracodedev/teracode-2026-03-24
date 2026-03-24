-- 世帯員の氏名を姓・名に分割
ALTER TABLE "DankaMember" ADD COLUMN "familyName" TEXT;
ALTER TABLE "DankaMember" ADD COLUMN "givenName" TEXT;

-- 既存データを移行（既存の name を familyName にコピー）
UPDATE "DankaMember" SET "familyName" = name;

-- NOT NULL 制約を付与
ALTER TABLE "DankaMember" ALTER COLUMN "familyName" SET NOT NULL;

-- 旧カラムを削除
ALTER TABLE "DankaMember" DROP COLUMN "name";
