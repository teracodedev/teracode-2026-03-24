-- 既存の Householder で FamilyRegister が未設定のものに自動作成してリンク
DO $$
DECLARE
  h RECORD;
  reg_id UUID;
BEGIN
  FOR h IN
    SELECT id, "familyName", "givenName"
    FROM "Householder"
    WHERE "familyRegisterId" IS NULL
  LOOP
    reg_id := gen_random_uuid();
    INSERT INTO "FamilyRegister" (id, "registerCode", name, "createdAt", "updatedAt")
    VALUES (
      reg_id,
      gen_random_uuid(),
      h."familyName" || h."givenName" || 'の家族・親族台帳',
      NOW(),
      NOW()
    );
    UPDATE "Householder"
    SET "familyRegisterId" = reg_id
    WHERE id = h.id;
  END LOOP;
END $$;

-- UNIQUE 制約を追加（1:1 を保証）
CREATE UNIQUE INDEX IF NOT EXISTS "Householder_familyRegisterId_key"
  ON "Householder"("familyRegisterId");
