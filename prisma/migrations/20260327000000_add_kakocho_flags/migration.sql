-- 過去帳フラグフィールドを世帯員テーブルに追加
ALTER TABLE "HouseholderMember" ADD COLUMN IF NOT EXISTS "isAnnaiFuyo"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "HouseholderMember" ADD COLUMN IF NOT EXISTS "isKeijiFuyo"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "HouseholderMember" ADD COLUMN IF NOT EXISTS "isNotePrintDisabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "HouseholderMember" ADD COLUMN IF NOT EXISTS "isMeinichiFusho"     BOOLEAN NOT NULL DEFAULT false;
