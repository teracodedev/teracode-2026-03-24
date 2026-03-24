-- 戸主（Householder）に個人情報フィールドを追加
ALTER TABLE "Householder" ADD COLUMN IF NOT EXISTS "gender"         TEXT;
ALTER TABLE "Householder" ADD COLUMN IF NOT EXISTS "birthDate"      TIMESTAMP(3);
ALTER TABLE "Householder" ADD COLUMN IF NOT EXISTS "deathDate"      TIMESTAMP(3);
ALTER TABLE "Householder" ADD COLUMN IF NOT EXISTS "dharmaName"     TEXT;
ALTER TABLE "Householder" ADD COLUMN IF NOT EXISTS "dharmaNameKana" TEXT;

-- 世帯員（HouseholderMember）に性別・メールを追加
ALTER TABLE "HouseholderMember" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "HouseholderMember" ADD COLUMN IF NOT EXISTS "email"  TEXT;
