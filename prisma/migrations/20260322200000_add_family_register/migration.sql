-- 家族・親族台帳テーブルを作成
CREATE TABLE IF NOT EXISTS "FamilyRegister" (
  "id"           TEXT NOT NULL,
  "registerCode" TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "note"         TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FamilyRegister_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FamilyRegister_registerCode_key"
  ON "FamilyRegister"("registerCode");

-- Householder に familyRegisterId カラムを追加
ALTER TABLE "Householder"
  ADD COLUMN IF NOT EXISTS "familyRegisterId" TEXT;

-- 外部キー制約を追加
ALTER TABLE "Householder"
  ADD CONSTRAINT "Householder_familyRegisterId_fkey"
  FOREIGN KEY ("familyRegisterId")
  REFERENCES "FamilyRegister"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
