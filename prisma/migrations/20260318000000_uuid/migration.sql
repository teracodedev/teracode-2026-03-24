-- UUID移行マイグレーション（既存データ保持）
-- 整数ID・dankaCodeをUUIDに変換する

-- ===== Step 1: 各テーブルにUUID用の一時カラムを追加 =====

ALTER TABLE "Danka"
  ADD COLUMN IF NOT EXISTS "_new_id"       TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS "_new_dankaCode" TEXT NOT NULL DEFAULT gen_random_uuid()::text;

ALTER TABLE "DankaMember"
  ADD COLUMN IF NOT EXISTS "_new_id"      TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS "_new_dankaId" TEXT;

ALTER TABLE "Ceremony"
  ADD COLUMN IF NOT EXISTS "_new_id" TEXT NOT NULL DEFAULT gen_random_uuid()::text;

ALTER TABLE "CeremonyParticipant"
  ADD COLUMN IF NOT EXISTS "_new_id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS "_new_ceremonyId"  TEXT,
  ADD COLUMN IF NOT EXISTS "_new_dankaId"     TEXT;

-- ===== Step 2: 外部キー列をUUIDマッピングで埋める =====

UPDATE "DankaMember" dm
SET "_new_dankaId" = d."_new_id"
FROM "Danka" d
WHERE dm."dankaId" = d."id";

UPDATE "CeremonyParticipant" cp
SET "_new_ceremonyId" = c."_new_id"
FROM "Ceremony" c
WHERE cp."ceremonyId" = c."id";

UPDATE "CeremonyParticipant" cp
SET "_new_dankaId" = d."_new_id"
FROM "Danka" d
WHERE cp."dankaId" = d."id";

-- ===== Step 3: 既存の制約・外部キーを削除 =====

ALTER TABLE "DankaMember"
  DROP CONSTRAINT IF EXISTS "DankaMember_dankaId_fkey";

ALTER TABLE "CeremonyParticipant"
  DROP CONSTRAINT IF EXISTS "CeremonyParticipant_ceremonyId_fkey",
  DROP CONSTRAINT IF EXISTS "CeremonyParticipant_dankaId_fkey",
  DROP CONSTRAINT IF EXISTS "CeremonyParticipant_ceremonyId_dankaId_key";

ALTER TABLE "Danka"
  DROP CONSTRAINT IF EXISTS "Danka_pkey",
  DROP CONSTRAINT IF EXISTS "Danka_dankaCode_key";

ALTER TABLE "DankaMember"
  DROP CONSTRAINT IF EXISTS "DankaMember_pkey";

ALTER TABLE "Ceremony"
  DROP CONSTRAINT IF EXISTS "Ceremony_pkey";

ALTER TABLE "CeremonyParticipant"
  DROP CONSTRAINT IF EXISTS "CeremonyParticipant_pkey";

-- ===== Step 4: 古い列を削除 =====

ALTER TABLE "Danka"
  DROP COLUMN "id",
  DROP COLUMN "dankaCode";

ALTER TABLE "DankaMember"
  DROP COLUMN "id",
  DROP COLUMN "dankaId";

ALTER TABLE "Ceremony"
  DROP COLUMN "id";

ALTER TABLE "CeremonyParticipant"
  DROP COLUMN "id",
  DROP COLUMN "ceremonyId",
  DROP COLUMN "dankaId";

-- ===== Step 5: 一時カラムを正式名にリネーム =====

ALTER TABLE "Danka"
  RENAME COLUMN "_new_id"        TO "id";
ALTER TABLE "Danka"
  RENAME COLUMN "_new_dankaCode" TO "dankaCode";

ALTER TABLE "DankaMember"
  RENAME COLUMN "_new_id"      TO "id";
ALTER TABLE "DankaMember"
  RENAME COLUMN "_new_dankaId" TO "dankaId";

ALTER TABLE "Ceremony"
  RENAME COLUMN "_new_id" TO "id";

ALTER TABLE "CeremonyParticipant"
  RENAME COLUMN "_new_id"         TO "id";
ALTER TABLE "CeremonyParticipant"
  RENAME COLUMN "_new_ceremonyId" TO "ceremonyId";
ALTER TABLE "CeremonyParticipant"
  RENAME COLUMN "_new_dankaId"    TO "dankaId";

-- ===== Step 6: NOT NULL制約を設定 =====

ALTER TABLE "DankaMember"
  ALTER COLUMN "dankaId" SET NOT NULL;

ALTER TABLE "CeremonyParticipant"
  ALTER COLUMN "ceremonyId" SET NOT NULL,
  ALTER COLUMN "dankaId"    SET NOT NULL;

-- ===== Step 7: 主キー・一意制約を再作成 =====

ALTER TABLE "Danka"
  ADD CONSTRAINT "Danka_pkey"        PRIMARY KEY ("id"),
  ADD CONSTRAINT "Danka_dankaCode_key" UNIQUE ("dankaCode");

ALTER TABLE "DankaMember"
  ADD CONSTRAINT "DankaMember_pkey" PRIMARY KEY ("id");

ALTER TABLE "Ceremony"
  ADD CONSTRAINT "Ceremony_pkey" PRIMARY KEY ("id");

ALTER TABLE "CeremonyParticipant"
  ADD CONSTRAINT "CeremonyParticipant_pkey"                PRIMARY KEY ("id"),
  ADD CONSTRAINT "CeremonyParticipant_ceremonyId_dankaId_key" UNIQUE ("ceremonyId", "dankaId");

-- ===== Step 8: 外部キー制約を再作成 =====

ALTER TABLE "DankaMember"
  ADD CONSTRAINT "DankaMember_dankaId_fkey"
    FOREIGN KEY ("dankaId") REFERENCES "Danka"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CeremonyParticipant"
  ADD CONSTRAINT "CeremonyParticipant_ceremonyId_fkey"
    FOREIGN KEY ("ceremonyId") REFERENCES "Ceremony"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "CeremonyParticipant_dankaId_fkey"
    FOREIGN KEY ("dankaId") REFERENCES "Danka"("id") ON DELETE CASCADE ON UPDATE CASCADE;
